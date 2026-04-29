import httpx
import asyncio

async def test():
    barcode = "5397063546824"
    url = f"https://api.upcitemdb.com/prod/trial/lookup?upc={barcode}"
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        print(f"Status: {response.status_code}")
        print(f"Body: {response.text}")

asyncio.run(test())
