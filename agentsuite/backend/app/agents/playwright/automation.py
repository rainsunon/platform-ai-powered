import asyncio
import json
import base64
from typing import Dict, Any, Optional, List, Tuple
from playwright.async_api import async_playwright, Browser, Page, BrowserContext
from PIL import Image
import io
import numpy as np
from app.services.llm_service import LLMService

class SemanticAutomationAgent:
    """
    Advanced semantic automation agent that understands web pages
    by their meaning, not by CSS selectors.
    """
    
    def __init__(self):
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        self.llm_service = LLMService()
        self.semantic_map = {}
        self.action_history = []
    
    async def initialize(self, headless: bool = True):
        """Initialize the browser and context."""
        playwright = await async_playwright().start()
        self.browser = await playwright.chromium.launch(
            headless=headless,
            args=['--no-sandbox', '--disable-setuid-sandbox']
        )
        self.context = await self.browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        )
        self.page = await self.context.new_page()
    
    async def navigate(self, url: str):
        """Navigate to a URL and build semantic map."""
        await self.page.goto(url, wait_until='networkidle')
        await self.build_semantic_map()
    
    async def build_semantic_map(self):
        """
        Build a comprehensive semantic map of the current page.
        This map includes ARIA roles, labels, text content, and visual hierarchy.
        """
        semantic_map = await self.page.evaluate('''() => {
            const map = [];
            const elements = document.querySelectorAll('*');
            
            elements.forEach((el, index) => {
                if (el.offsetParent === null && el.tagName !== 'HTML' && el.tagName !== 'BODY') {
                    return; // Skip hidden elements
                }
                
                const rect = el.getBoundingClientRect();
                const style = window.getComputedStyle(el);
                
                const elementInfo = {
                    index: index,
                    tag: el.tagName.toLowerCase(),
                    text: el.textContent?.trim().substring(0, 100) || '',
                    ariaRole: el.getAttribute('role'),
                    ariaLabel: el.getAttribute('aria-label'),
                    ariaDescription: el.getAttribute('aria-description'),
                    title: el.title,
                    placeholder: el.placeholder,
                    name: el.name,
                    id: el.id,
                    className: el.className,
                    type: el.type,
                    href: el.href,
                    value: el.value,
                    checked: el.checked,
                    disabled: el.disabled,
                    readonly: el.readOnly,
                    required: el.required,
                    visible: style.display !== 'none' && style.visibility !== 'hidden',
                    position: {
                        x: rect.x,
                        y: rect.y,
                        width: rect.width,
                        height: rect.height,
                        centerX: rect.x + rect.width / 2,
                        centerY: rect.y + rect.height / 2,
                    },
                    computedStyle: {
                        cursor: style.cursor,
                        opacity: parseFloat(style.opacity),
                        zIndex: style.zIndex,
                    },
                    parentIndex: el.parentElement ? 
                        Array.from(el.parentElement.children).indexOf(el) : -1,
                    childrenCount: el.children.length,
                };
                
                map.push(elementInfo);
            });
            
            return map;
        }''')
        
        self.semantic_map = semantic_map
        return semantic_map
    
    async def find_element_semantically(
        self,
        description: str,
        element_type: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Find an element based on natural language description using LLM.
        """
        # Prepare context for LLM
        context = {
            "description": description,
            "element_type": element_type,
            "available_elements": [
                {
                    "index": el["index"],
                    "tag": el["tag"],
                    "text": el["text"],
                    "ariaRole": el["ariaRole"],
                    "ariaLabel": el["ariaLabel"],
                    "placeholder": el["placeholder"],
                    "id": el["id"],
                    "className": el["className"],
                    "type": el["type"],
                    "position": el["position"],
                }
                for el in self.semantic_map[:200]  # Limit context size
                if el.get("visible")
            ]
        }
        
        prompt = f"""
        Find the element that matches this description: "{description}"
        {f'Element type should be: {element_type}' if element_type else ''}
        
        Available elements:
        {json.dumps(context['available_elements'], indent=2)}
        
        Return the index of the matching element as a JSON: {{"index": number, "confidence": number, "reasoning": "string"}}
        If no element matches, return {{"index": -1, "confidence": 0, "reasoning": "string"}}
        """
        
        response = await self.llm_service.acomplete(prompt, temperature=0.3)
        result = json.loads(response)
        
        if result["index"] >= 0:
            return self.semantic_map[result["index"]]
        
        return None
    
    async def click_semantically(
        self,
        description: str,
        wait_after: int = 1000,
    ) -> bool:
        """
        Click an element identified by semantic description.
        """
        element = await self.find_element_semantically(description, element_type="button")
        
        if not element:
            # Try with broader search
            element = await self.find_element_semantically(description)
        
        if element:
            try:
                await self.page.click(f'[data-semantic-index="{element["index"]}"]')
                await self.page.wait_for_timeout(wait_after)
                
                self.action_history.append({
                    "action": "click",
                    "description": description,
                    "element": element,
                    "success": True,
                })
                
                return True
            except Exception as e:
                # Fallback to coordinate-based click
                try:
                    await self.page.mouse.click(
                        element["position"]["centerX"],
                        element["position"]["centerY"]
                    )
                    await self.page.wait_for_timeout(wait_after)
                    
                    self.action_history.append({
                        "action": "click",
                        "description": description,
                        "element": element,
                        "success": True,
                        "fallback": "coordinates",
                    })
                    
                    return True
                except Exception:
                    pass
        
        self.action_history.append({
            "action": "click",
            "description": description,
            "success": False,
            "error": "Element not found",
        })
        
        return False
    
    async def fill_semantically(
        self,
        field_description: str,
        value: str,
    ) -> bool:
        """
        Fill an input field identified by semantic description.
        """
        element = await self.find_element_semantically(
            field_description,
            element_type="input",
        )
        
        if not element:
            return False
        
        try:
            # Try to find the actual selector
            if element.get("id"):
                await self.page.fill(f'#{element["id"]}', value)
            elif element.get("name"):
                await self.page.fill(f'[name="{element["name"]}"]', value)
            else:
                # Use coordinate-based filling
                await self.page.mouse.click(
                    element["position"]["centerX"],
                    element["position"]["centerY"]
                )
                await self.page.keyboard.type(value)
            
            self.action_history.append({
                "action": "fill",
                "description": field_description,
                "value": value,
                "element": element,
                "success": True,
            })
            
            return True
        except Exception as e:
            self.action_history.append({
                "action": "fill",
                "description": field_description,
                "success": False,
                "error": str(e),
            })
            
            return False
    
    async def extract_data_semantically(
        self,
        data_description: str,
    ) -> Optional[Dict[str, Any]]:
        """
        Extract data from the page based on natural language description.
        """
        # Take screenshot for visual context
        screenshot = await self.page.screenshot(type='png')
        screenshot_b64 = base64.b64encode(screenshot).decode()
        
        # Get page text content
        text_content = await self.page.evaluate('''() => {
            return document.body.innerText;
        }''')
        
        prompt = f"""
        Extract the following data from the web page: {data_description}
        
        Page text content:
        {text_content[:5000]}
        
        Available interactive elements:
        {json.dumps([
            {
                "text": el["text"],
                "tag": el["tag"],
                "type": el["type"],
                "ariaLabel": el["ariaLabel"],
            }
            for el in self.semantic_map[:100]
            if el.get("visible") and el.get("text")
        ], indent=2)}
        
        Return the extracted data as a JSON object.
        """
        
        response = await self.llm_service.acomplete(prompt)
        
        try:
            data = json.loads(response)
            return data
        except json.JSONDecodeError:
            return {"extracted_text": response}
    
    async def wait_for_semantic_condition(
        self,
        condition: str,
        timeout: int = 30000,
    ) -> bool:
        """
        Wait for a semantic condition to be true on the page.
        """
        start_time = asyncio.get_event_loop().time()
        
        while (asyncio.get_event_loop().time() - start_time) * 1000 < timeout:
            await self.build_semantic_map()
            
            # Check condition using LLM
            prompt = f"""
            Check if the following condition is true on the current page:
            
            Condition: {condition}
            
            Page summary:
            - Title: {await self.page.title()}
            - URL: {self.page.url}
            - Visible text: {await self.page.evaluate('() => document.body.innerText.substring(0, 1000)')}
            
            Respond with ONLY "true" or "false".
            """
            
            response = await self.llm_service.acomplete(prompt, temperature=0)
            
            if response.strip().lower() == "true":
                return True
            
            await asyncio.sleep(1)
        
        return False
    
    async def execute_instruction(
        self,
        instruction: str,
    ) -> Dict[str, Any]:
        """
        Execute a complex natural language instruction on the page.
        """
        # Build semantic map
        await self.build_semantic_map()
        
        # Decompose instruction into actions
        prompt = f"""
        Decompose the following automation instruction into individual actions:
        
        Instruction: {instruction}
        
        Current page context:
        - URL: {self.page.url}
        - Title: {await self.page.title()}
        
        Available actions:
        - click(description): Click an element matching the description
        - fill(description, value): Fill a field matching the description
        - wait(condition): Wait for a condition to be true
        - extract(description): Extract data matching the description
        - navigate(url): Navigate to a URL
        
        Return as a JSON array of action objects:
        [
            {{"action": "click", "description": "..."}},
            {{"action": "fill", "description": "...", "value": "..."}},
        ]
        """
        
        response = await self.llm_service.acomplete(prompt)
        
        try:
            actions = json.loads(response)
        except json.JSONDecodeError:
            return {"success": False, "error": "Failed to parse instruction"}
        
        # Execute actions sequentially
        results = []
        for action in actions:
            action_type = action.get("action")
            
            if action_type == "click":
                success = await self.click_semantically(action["description"])
                results.append({"action": action, "success": success})
            
            elif action_type == "fill":
                success = await self.fill_semantically(
                    action["description"],
                    action["value"],
                )
                results.append({"action": action, "success": success})
            
            elif action_type == "wait":
                success = await self.wait_for_semantic_condition(
                    action["condition"],
                )
                results.append({"action": action, "success": success})
            
            elif action_type == "extract":
                data = await self.extract_data_semantically(action["description"])
                results.append({
                    "action": action,
                    "success": data is not None,
                    "data": data,
                })
            
            elif action_type == "navigate":
                await self.navigate(action["url"])
                results.append({"action": action, "success": True})
            
            else:
                results.append({
                    "action": action,
                    "success": False,
                    "error": f"Unknown action type: {action_type}",
                })
        
        return {
            "success": all(r["success"] for r in results),
            "actions_executed": len(actions),
            "successful_actions": len([r for r in results if r["success"]]),
            "results": results,
        }
    
    async def take_screenshot_with_annotations(
        self,
        annotations: List[Dict[str, Any]],
    ) -> bytes:
        """
        Take a screenshot with visual annotations for human review.
        """
        screenshot = await self.page.screenshot(type='png')
        
        # Convert to PIL Image for annotation
        img = Image.open(io.BytesIO(screenshot))
        
        # Add annotations (in production, use more sophisticated annotation)
        # This is a simplified version
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='PNG')
        
        return img_byte_arr.getvalue()
    
    async def cleanup(self):
        """Clean up browser resources."""
        if self.context:
            await self.context.close()
        if self.browser:
            await self.browser.close()

# Dockerfile for Playwright Agent