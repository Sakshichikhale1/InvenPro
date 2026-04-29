from duckduckgo_search import DDGS

def test():
    barcode = "5397063546824"
    with DDGS() as ddgs:
        results = ddgs.text(barcode, max_results=5)
        for r in results:
            print(f"Title: {r['title']}")
            print(f"Body: {r['body']}")
            print("---")

test()
