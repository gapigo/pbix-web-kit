"""Build narratives for pages using heuristics (and optionally LLM enrichment)."""

from __future__ import annotations

import logging
import os
from typing import Any

from pbix_storyboard.schema import PageBrief

logger = logging.getLogger(__name__)


def build_narratives(
    page_briefs: list[PageBrief],
    dashboard_name: str,
) -> list[PageBrief]:
    """Build narrative text for each page brief using rule-based heuristics.

    If OPENAI_API_KEY env var is set, tries to enrich via DeepSeek-compatible API.
    Falls back to heuristic on failure.
    """
    for brief in page_briefs:
        brief.narrative = _heuristic_narrative(brief)

    # Optional LLM enrichment
    api_key = os.environ.get("OPENAI_API_KEY")
    if api_key and page_briefs:
        try:
            _try_llm_enrich(page_briefs, api_key)
        except Exception as exc:
            logger.warning("LLM narrative enrichment failed: %s — using heuristics", exc)

    return page_briefs


def _heuristic_narrative(brief: PageBrief) -> str:
    """Generate narrative from page structure."""
    visual_count = len([v for v in brief.visuals if v.importance <= 3])
    dims = set()
    for v in brief.visuals:
        for d in v.dimensions:
            parts = d.split(".", 1)
            dims.add(parts[-1] if len(parts) > 1 else parts[0])

    dim_list = list(dims)[:3]
    dim_text = f", broken down by {', '.join(dim_list)}" if dim_list else ""

    hero = brief.hero_metric or "key metrics"
    narrative = (
        f"This page ({brief.display_name}) presents {hero}"
        f"{dim_text}. "
        f"It features {visual_count} main visual{'s' if visual_count != 1 else ''} "
        f"including KPIs, charts, and tables."
    )
    return narrative


def _try_llm_enrich(briefs: list[PageBrief], api_key: str) -> None:
    """Try to enrich narratives using an OpenAI-compatible API."""
    # This is optional; if the request fails we fall back to heuristics.
    base_url = os.environ.get("OPENAI_BASE_URL", "https://api.deepseek.com/v1")
    try:
        import httpx  # type: ignore[import-untyped]
    except ImportError:
        logger.warning("httpx not installed, skipping LLM enrichment")
        return

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    for brief in briefs:
        visual_list = "\n".join(
            f"- {v.purpose} (importance {v.importance})"
            for v in brief.visuals[:6]
        )
        prompt = (
            f"Given this Power BI page summary:\n"
            f"**{brief.display_name}**\n"
            f"Hero metric: {brief.hero_metric or 'N/A'}\n"
            f"Visuals:\n{visual_list}\n\n"
            f"Write a 2-sentence narrative in plain English describing "
            f"what this page communicates and what insight a viewer should take away. "
            f"Be concise, factual, and business-focused."
        )

        try:
            resp = httpx.post(
                f"{base_url}/chat/completions",
                headers=headers,
                json={
                    "model": "deepseek-chat",
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 200,
                    "temperature": 0.3,
                },
                timeout=15.0,
            )
            if resp.status_code == 200:
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                if content:
                    brief.narrative = content.strip()
        except Exception as exc:
            logger.debug("LLM enrichment failed for %s: %s", brief.display_name, exc)
