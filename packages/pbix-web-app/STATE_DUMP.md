$ tsc -b && vite build
[36mvite v8.0.11 [32mbuilding client environment for production...[36m[39m
[2K
transforming...‘£Ù 589 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.46 kB ‘ˆÈ gzip:   0.29 kB
dist/assets/index-BqKlvggY.css   19.52 kB ‘ˆÈ gzip:   4.41 kB
dist/assets/index-eFCoTsjm.js   835.21 kB ‘ˆÈ gzip: 201.02 kB

[33m[plugin builtin:vite-reporter] 
(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rolldownOptions.output.codeSplitting to improve chunking: https://rolldown.rs/reference/OutputOptions.codeSplitting
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.[39m
[32m‘£Ù built in 621ms[39m
