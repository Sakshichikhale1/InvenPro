import httpx
import re

async def test():
    barcode = "5397063546824"
    # User-agent is important for Google
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    url = f"https://www.google.com/search?q={barcode}"
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers)
        print(f"Status: {response.status_code}")
        # Look for titles in the search results
        # This is a bit hacky but might work for a quick demo
        html = response.text
        # Look for something that looks like a product title
        # In Google Search, titles are usually inside <h3 class="LC20lb ...">
        titles = re.findall(r'<h3[^>]*>(.*?)</h3>', html)
        for t in titles:
            print(f"Found title: {t}")

import asyncio
asyncio.run(test())
