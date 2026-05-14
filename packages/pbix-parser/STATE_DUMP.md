============================= test session starts =============================
platform win32 -- Python 3.11.0, pytest-9.0.3, pluggy-1.6.0 -- C:\Users\xgabr\AppData\Local\Programs\Python\Python311\python.exe
cachedir: .pytest_cache
rootdir: C:\Users\xgabr\workspace\pbi-test\packages\pbix-parser
configfile: pyproject.toml
plugins: anyio-4.12.1
collecting ... collected 11 items

src/pbix_parser/tests/test_extract.py::TestSchema::test_pbixir_has_source PASSED [  9%]
src/pbix_parser/tests/test_extract.py::TestSchema::test_has_pages PASSED [ 18%]
src/pbix_parser/tests/test_extract.py::TestSchema::test_page_has_visuals PASSED [ 27%]
src/pbix_parser/tests/test_extract.py::TestSchema::test_at_least_one_known_visual PASSED [ 36%]
src/pbix_parser/tests/test_extract.py::TestExtractErrors::test_nonexistent_file PASSED [ 45%]
src/pbix_parser/tests/test_extract.py::TestExtractErrors::test_non_pbix_file PASSED [ 54%]
src/pbix_parser/tests/test_extract.py::TestDataExport::test_export_produces_json PASSED [ 63%]
src/pbix_parser/tests/test_extract.py::TestDataExport::test_ir_roundtrips_json PASSED [ 72%]
src/pbix_parser/tests/test_extract.py::TestVisualParser::test_parse_query_ref_basic PASSED [ 81%]
src/pbix_parser/tests/test_extract.py::TestVisualParser::test_parse_query_ref_aggregated PASSED [ 90%]
src/pbix_parser/tests/test_extract.py::TestVisualParser::test_parse_query_ref_no_table PASSED [100%]

============================= 11 passed in 3.98s ==============================
