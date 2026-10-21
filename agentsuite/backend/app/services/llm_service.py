from typing import Optional, Dict, Any, List, Union
import json
from litellm import completion, acompletion
from app.core.config import settings
import asyncio

class LLMService:
    """
    Unified LLM service using LiteLLM for multi-provider support.
    Supports OpenAI, Anthropic, Google, and other providers.
    """
    
    def __init__(self):
        self.model = settings.LLM_MODEL
        self.temperature = settings.LLM_TEMPERATURE
        self.max_tokens = settings.LLM_MAX_TOKENS
        
        # Set API keys based on provider
        if settings.OPENAI_API_KEY:
            import os
            os.environ["OPENAI_API_KEY"] = settings.OPENAI_API_KEY
        
        if settings.ANTHROPIC_API_KEY:
            import os
            os.environ["ANTHROPIC_API_KEY"] = settings.ANTHROPIC_API_KEY
    
    def complete(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        model: Optional[str] = None,
        response_format: Optional[Dict[str, Any]] = None,
    ) -> str:
        """
        Synchronous completion using LiteLLM.
        """
        messages = []
        
        if system_prompt:
            messages.append({
                "role": "system",
                "content": system_prompt,
            })
        
        messages.append({
            "role": "user",
            "content": prompt,
        })
        
        kwargs = {
            "model": model or self.model,
            "messages": messages,
            "temperature": temperature or self.temperature,
            "max_tokens": max_tokens or self.max_tokens,
        }
        
        if response_format:
            kwargs["response_format"] = response_format
        
        try:
            response = completion(**kwargs)
            return response.choices[0].message.content
        except Exception as e:
            # Fallback to another provider if primary fails
            return self._fallback_complete(messages, temperature, max_tokens)
    
    async def acomplete(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        model: Optional[str] = None,
        response_format: Optional[Dict[str, Any]] = None,
    ) -> str:
        """
        Asynchronous completion using LiteLLM.
        """
        messages = []
        
        if system_prompt:
            messages.append({
                "role": "system",
                "content": system_prompt,
            })
        
        messages.append({
            "role": "user",
            "content": prompt,
        })
        
        kwargs = {
            "model": model or self.model,
            "messages": messages,
            "temperature": temperature or self.temperature,
            "max_tokens": max_tokens or self.max_tokens,
        }
        
        if response_format:
            kwargs["response_format"] = response_format
        
        try:
            response = await acompletion(**kwargs)
            return response.choices[0].message.content
        except Exception as e:
            # Fallback to another provider
            return await self._fallback_acomplete(
                messages,
                temperature,
                max_tokens,
            )
    
    def complete_with_vision(
        self,
        prompt: str,
        images: List[str],  # Base64 encoded images
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> str:
        """
        Multimodal completion with vision support.
        """
        messages = []
        
        if system_prompt:
            messages.append({
                "role": "system",
                "content": system_prompt,
            })
        
        content = [{"type": "text", "text": prompt}]
        
        for image in images:
            content.append({
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/png;base64,{image}",
                },
            })
        
        messages.append({
            "role": "user",
            "content": content,
        })
        
        try:
            response = completion(
                model="gpt-4-vision-preview",  # Or appropriate vision model
                messages=messages,
                temperature=temperature or self.temperature,
                max_tokens=max_tokens or self.max_tokens,
            )
            return response.choices[0].message.content
        except Exception as e:
            raise e
    
    def extract_json(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Extract JSON from LLM response.
        """
        response = self.complete(
            prompt=prompt,
            system_prompt=system_prompt or "Always respond with valid JSON.",
            temperature=0.3,
            response_format={"type": "json_object"},
        )
        
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            # Try to extract JSON from response
            import re
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            raise
    
    def _fallback_complete(
        self,
        messages: List[Dict[str, str]],
        temperature: Optional[float],
        max_tokens: Optional[int],
    ) -> str:
        """Fallback to another provider if primary fails."""
        fallback_models = [
            "anthropic/claude-3-sonnet-20240229",
            "google/gemini-pro",
            "openai/gpt-3.5-turbo",
        ]
        
        for model in fallback_models:
            if model == self.model:
                continue
            
            try:
                response = completion(
                    model=model,
                    messages=messages,
                    temperature=temperature or self.temperature,
                    max_tokens=max_tokens or self.max_tokens,
                )
                return response.choices[0].message.content
            except Exception:
                continue
        
        raise Exception("All LLM providers failed")
    
    async def _fallback_acomplete(
        self,
        messages: List[Dict[str, str]],
        temperature: Optional[float],
        max_tokens: Optional[int],
    ) -> str:
        """Async fallback to another provider."""
        fallback_models = [
            "anthropic/claude-3-sonnet-20240229",
            "google/gemini-pro",
            "openai/gpt-3.5-turbo",
        ]
        
        for model in fallback_models:
            if model == self.model:
                continue
            
            try:
                response = await acompletion(
                    model=model,
                    messages=messages,
                    temperature=temperature or self.temperature,
                    max_tokens=max_tokens or self.max_tokens,
                )
                return response.choices[0].message.content
            except Exception:
                continue
        
        raise Exception("All LLM providers failed")
    
    def count_tokens(self, text: str) -> int:
        """Estimate token count."""
        # Rough estimation: ~4 characters per token
        return len(text) // 4
    
    def chunk_text(
        self,
        text: str,
        max_chunk_tokens: int = 4000,
        overlap_tokens: int = 200,
    ) -> List[str]:
        """Split text into chunks for processing."""
        words = text.split()
        chunks = []
        current_chunk = []
        current_tokens = 0
        
        for word in words:
            word_tokens = self.count_tokens(word)
            
            if current_tokens + word_tokens > max_chunk_tokens:
                chunks.append(" ".join(current_chunk))
                
                # Keep overlap
                overlap_words = []
                overlap_token_count = 0
                for w in reversed(current_chunk):
                    w_tokens = self.count_tokens(w)
                    if overlap_token_count + w_tokens > overlap_tokens:
                        break
                    overlap_words.insert(0, w)
                    overlap_token_count += w_tokens
                
                current_chunk = overlap_words
                current_tokens = overlap_token_count
            
            current_chunk.append(word)
            current_tokens += word_tokens
        
        if current_chunk:
            chunks.append(" ".join(current_chunk))
        
        return chunks