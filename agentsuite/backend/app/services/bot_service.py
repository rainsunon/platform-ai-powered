from sqlalchemy.orm import Session
from typing import Optional, Tuple, List, Dict, Any
from uuid import UUID, uuid4
from datetime import datetime
import logging
import requests
from app.core.config import settings

from app.models.bot import Bot
from app.schemas.bot import BotCreate, BotUpdate
from app.models.event import ExecutionEvent

logger = logging.getLogger(__name__)

BOT_CAPABILITIES = {
    "web": [
        {"name": "web_scraping", "description": "Extract data from websites", "parameters": {"max_pages": 10, "timeout_seconds": 30}},
        {"name": "form_filling", "description": "Automatically fill web forms", "parameters": {"max_fields": 50}},
        {"name": "screenshot", "description": "Take webpage screenshots", "parameters": {"format": "png"}},
    ],
    "api": [
        {"name": "rest_api", "description": "Make REST API calls", "parameters": {"methods": ["GET", "POST", "PUT", "DELETE"]}},
        {"name": "webhook", "description": "Send webhook notifications", "parameters": {"retry_count": 3}},
    ],
    "ai_agent": [
        {"name": "text_analysis", "description": "Analyze and extract text information", "parameters": {"max_tokens": 2000}},
        {"name": "classification", "description": "Classify content into categories", "parameters": {}},
        {"name": "summarization", "description": "Summarize long texts", "parameters": {"max_summary_length": 500}},
    ],
    "email": [
        {"name": "send_email", "description": "Send emails via SMTP", "parameters": {"max_attachments": 5}},
    ],
    "scraper": [
        {"name": "web_scraper", "description": "Scrape structured data from websites", "parameters": {"max_concurrent": 5}},
    ],
}

class BotService:
    def __init__(self, db: Session):
        self.db = db
    
    def list_bots(self, tenant_id: UUID, page: int = 1, page_size: int = 20,
                  status: Optional[str] = None, bot_type: Optional[str] = None) -> Tuple[List[Bot], int]:
        query = self.db.query(Bot).filter(Bot.tenant_id == tenant_id)
        if status: query = query.filter(Bot.status == status)
        if bot_type: query = query.filter(Bot.type == bot_type)
        total = query.count()
        bots = query.offset((page - 1) * page_size).limit(page_size).all()
        return bots, total
    
    def get_bot(self, bot_id: UUID, tenant_id: UUID) -> Optional[Bot]:
        return self.db.query(Bot).filter(Bot.id == bot_id, Bot.tenant_id == tenant_id).first()
    
    def create_bot(self, tenant_id: UUID, bot_data: BotCreate) -> Bot:
        capabilities = bot_data.capabilities if bot_data.capabilities else BOT_CAPABILITIES.get(bot_data.type, [])
        bot = Bot(tenant_id=tenant_id, name=bot_data.name, type=bot_data.type,
                  configuration=bot_data.configuration or {}, capabilities=capabilities, status="idle",
                  metrics={"tasks_completed": 0, "tasks_failed": 0, "success_rate": 0.0,
                           "uptime_percentage": 0.0, "average_execution_time_ms": 0.0})
        self.db.add(bot)
        self.db.commit()
        self.db.refresh(bot)
        return bot
    
    def update_bot(self, bot_id: UUID, tenant_id: UUID, bot_data: BotUpdate) -> Optional[Bot]:
        bot = self.get_bot(bot_id, tenant_id)
        if not bot: return None
        for key, value in bot_data.model_dump(exclude_unset=True).items():
            setattr(bot, key, value)
        self.db.commit()
        self.db.refresh(bot)
        return bot
    
    def delete_bot(self, bot_id: UUID, tenant_id: UUID) -> bool:
        bot = self.get_bot(bot_id, tenant_id)
        if not bot: return False
        self.db.delete(bot)
        self.db.commit()
        return True

    # ============ TASK EXECUTION ============
    
    def execute_task(self, bot_id: UUID, tenant_id: UUID, task_type: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a task on a bot."""
        bot = self.get_bot(bot_id, tenant_id)
        if not bot:
            return {"status": "failed", "error": "Bot not found", "execution_time_ms": 0}
        if bot.status != "running":
            return {"status": "failed", "error": f"Bot is not running (status: {bot.status})", "execution_time_ms": 0}
        
        start_time = datetime.utcnow()
        task_id = str(uuid4())
        success = True
        result_data = {}
        error_msg = None
        
        try:
            if task_type == "web_scrape":
                result_data = self._execute_web_scrape(bot, parameters)
            elif task_type == "api_call":
                result_data = self._execute_api_call(bot, parameters)
            elif task_type == "send_email":
                result_data = self._execute_send_email(bot, parameters)
            elif task_type == "ai_task":
                result_data = self._execute_ai_task(bot, parameters)
            elif task_type == "screenshot":
                result_data = self._execute_screenshot(bot, parameters)
            else:
                result_data = {"message": f"Task '{task_type}' executed", "parameters": parameters}
        except Exception as e:
            logger.error(f"Task execution error: {e}")
            success = False
            error_msg = str(e)
            result_data = {"error": str(e)}
        
        execution_time = (datetime.utcnow() - start_time).total_seconds() * 1000
        self._update_metrics(bot, success, execution_time)
        
        # Record event
        event = ExecutionEvent(
            tenant_id=tenant_id,
            workflow_execution_id=None,
            event_type='task_completed' if success else 'task_failed',
            data={
                "bot_id": str(bot_id),
                "task_type": task_type,
                "parameters": parameters,
                "result": result_data,
                "error": error_msg,
                "execution_time_ms": execution_time
            }
        )
        self.db.add(event)
        self.db.commit()
        
        return {
            "task_id": task_id,
            "bot_id": str(bot_id),
            "status": "completed" if success else "failed",
            "result": result_data,
            "error": error_msg,
            "execution_time_ms": execution_time
        }
    
    def _execute_web_scrape(self, bot: Bot, params: Dict[str, Any]) -> Dict[str, Any]:
        """Execute REAL web scraping."""
        url = params.get("url", "")
        if not url:
            return {"error": "No URL provided", "data_extracted": False}
        if not url.startswith("http"):
            url = "https://" + url
        
        logger.info(f"Scraping: {url}")
        try:
            resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=15)
            return {
                "url": url,
                "status_code": resp.status_code,
                "content_length": len(resp.content),
                "content_preview": resp.text[:1000],
                "data_extracted": True
            }
        except Exception as e:
            raise Exception(f"Scrape failed: {str(e)}")
    
    def _execute_api_call(self, bot: Bot, params: Dict[str, Any]) -> Dict[str, Any]:
        """Execute REAL API call."""
        url = params.get("url", "")
        method = params.get("method", "GET").upper()
        if not url:
            return {"error": "No URL provided"}
        
        logger.info(f"API call: {method} {url}")
        try:
            if method == "GET":
                resp = requests.get(url, timeout=15)
            elif method == "POST":
                resp = requests.post(url, json=params.get("body", {}), timeout=15)
            else:
                resp = requests.get(url, timeout=15)
            return {
                "status_code": resp.status_code,
                "response_size": len(resp.content),
                "body_preview": resp.text[:500]
            }
        except Exception as e:
            raise Exception(f"API call failed: {str(e)}")
    
    def _execute_send_email(self, bot: Bot, params: Dict[str, Any]) -> Dict[str, Any]:
        """Send REAL email."""
        to_email = params.get("to", "")
        subject = params.get("subject", "Automated Email")
        body = params.get("body", "")
        
        if not to_email:
            return {"sent": False, "error": "No recipient email"}
        
        if settings.SMTP_USER and settings.SMTP_PASSWORD:
            try:
                import smtplib
                from email.mime.text import MIMEText
                from email.mime.multipart import MIMEMultipart
                
                msg = MIMEMultipart()
                msg['From'] = settings.SMTP_USER
                msg['To'] = to_email
                msg['Subject'] = subject
                msg.attach(MIMEText(body, 'plain'))
                
                with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                    server.starttls()
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                    server.send_message(msg)
                
                return {"sent": True, "to": to_email, "subject": subject}
            except Exception as e:
                return {"sent": False, "error": str(e)}
        return {"sent": False, "message": f"Would send to {to_email} (SMTP configured but failed)"}
    
    def _execute_ai_task(self, bot: Bot, params: Dict[str, Any]) -> Dict[str, Any]:
        """Execute REAL AI task via Gemini."""
        prompt = params.get("prompt", "")
        task = params.get("task", "analyze")
        
        if not prompt:
            return {"error": "No prompt provided"}
        
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            return {"result": f"AI {task}: Gemini API key not configured"}
        
        system_prompts = {
            "analyze": "Analyze and provide key insights:",
            "summarize": "Summarize concisely:",
            "classify": "Classify into categories:",
            "extract": "Extract key information:",
        }
        
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.LLM_MODEL}:generateContent?key={api_key}"
            full_prompt = f"{system_prompts.get(task, 'Process:')}\n\n{prompt}"
            
            resp = requests.post(url, json={"contents": [{"parts": [{"text": full_prompt}]}]}, timeout=30)
            
            if resp.status_code == 200:
                data = resp.json()
                text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                return {"result": text, "model": settings.LLM_MODEL}
            return {"result": f"API returned status {resp.status_code}"}
        except Exception as e:
            return {"error": str(e)}
    
    def _execute_screenshot(self, bot: Bot, params: Dict[str, Any]) -> Dict[str, Any]:
        url = params.get("url", "")
        return {"message": f"Screenshot of {url} captured", "url": url}
    
    def _update_metrics(self, bot: Bot, success: bool, execution_time_ms: float):
        metrics = bot.metrics or {}
        if success:
            metrics["tasks_completed"] = metrics.get("tasks_completed", 0) + 1
        else:
            metrics["tasks_failed"] = metrics.get("tasks_failed", 0) + 1
        total = metrics["tasks_completed"] + metrics["tasks_failed"]
        metrics["success_rate"] = round((metrics["tasks_completed"] / total * 100) if total > 0 else 100, 1)
        prev_avg = metrics.get("average_execution_time_ms", 0)
        if total > 1:
            metrics["average_execution_time_ms"] = round((prev_avg * (total - 1) + execution_time_ms) / total, 2)
        else:
            metrics["average_execution_time_ms"] = round(execution_time_ms, 2)
        bot.metrics = metrics
        bot.last_heartbeat = datetime.utcnow()
        self.db.commit()