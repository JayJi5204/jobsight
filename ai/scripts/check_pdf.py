import sys

import pymupdf

doc = pymupdf.open(sys.argv[1])
print(f"쪽수: {doc.page_count}")

text = doc[2].get_text()
print(f"--- 3쪽 ({len(text)}자) ---")
print(text[:300])
