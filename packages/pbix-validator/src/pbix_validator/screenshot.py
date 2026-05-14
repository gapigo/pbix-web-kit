"""Take screenshots of the web app using Playwright."""

from playwright.sync_api import sync_playwright


def take_screenshot(url: str, output_path: str, wait_ms: int = 5000) -> None:
    """Navigate to a URL and take a full-page screenshot.
    
    Args:
        url: The URL to navigate to.
        output_path: Where to save the screenshot.
        wait_ms: Milliseconds to wait for page to render.
    """
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 900})
        page.goto(url, wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(wait_ms)
        page.screenshot(path=output_path, full_page=True)
        browser.close()
