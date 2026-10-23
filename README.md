# Bubblify
Open `index.html` in a browser (no build step). To publish: push this folder to a GitHub repo, then Settings > Pages > deploy from the main branch.
Print answer sheets at 100% (Actual size). Data is stored in the browser; use Settings > Download backup regularly.
Installable/offline mode (service worker) only works over HTTPS, i.e. on GitHub Pages, not from a double-clicked file. After deploying changes, bump `C` in sw.js if an old version sticks.
The camera needs HTTPS or localhost (GitHub Pages is fine). 'Upload photos' on the Scan page works anywhere. Scanner thresholds live at the top of js/scanner.js.
