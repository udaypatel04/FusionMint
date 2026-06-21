
        let extractedDominantColorsHexCache = [];

        function showProcessingOverlay(title = "Baking Operation Pipeline", subtitle = "Compiling data payload structures...") {
            const overlay = document.getElementById('matrix-processing-overlay');
            document.getElementById('overlay-main-title').innerText = title;
            document.getElementById('overlay-status-label').innerText = subtitle;
            overlay.classList.add('active');
        }

        function hideProcessingOverlay() {
            document.getElementById('matrix-processing-overlay').classList.remove('active');
        }

        function handleSliderCountAdjustment(val) {
            document.getElementById('lbl-swatch-count').innerText = val;
            if (extractedDominantColorsHexCache.length > 0) {
                extractDominantPaletteMatrixStructure();
            }
        }

        function loadGraphicFileIntoPalettePipeline(inputElement) {
            if (!inputElement.files || inputElement.files.length === 0) return;
            const targetFile = inputElement.files[0];

            showProcessingOverlay("Decompressing Image Object", "Mapping raster track layers channels...");

            const readerInstance = new FileReader();
            readerInstance.onload = function(e) {
                const imgElement = document.getElementById('pipeline-source-img');
                imgElement.onload = function() {
                    document.getElementById('empty-sandbox-state').classList.add('hidden');
                    
                    document.getElementById('metrics-filename-lbl').innerText = targetFile.name;
                    document.getElementById('metrics-size-lbl').innerText = `Size: ${(targetFile.size / 1024).toFixed(1)} KB`;

                    document.getElementById('wrapper-raster-source-box').classList.replace('hidden', 'flex');
                    document.getElementById('wrapper-dominant-colors-box').classList.replace('hidden', 'flex');
                    document.getElementById('wrapper-harmony-schemes-box').classList.replace('hidden', 'flex');
                    document.getElementById('compilation-actions-deck').classList.replace('hidden', 'flex');

                    extractDominantPaletteMatrixStructure();
                };
                imgElement.src = e.target.result;
            };
            readerInstance.readAsDataURL(targetFile);
            inputElement.value = "";
        }

        function extractDominantPaletteMatrixStructure() {
            const img = document.getElementById('pipeline-source-img');
            const canvas = document.getElementById('internal-quantization-canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = 32;
            canvas.height = 32;
            ctx.drawImage(img, 0, 0, 32, 32);
            
            const pixelData = ctx.getImageData(0, 0, 32, 32).data;
            let colorBucketsMap = {};

            for (let i = 0; i < pixelData.length; i += 4) {
                const r = pixelData[i];
                const g = pixelData[i+1];
                const b = pixelData[i+2];
                const alpha = pixelData[i+3];

                if (alpha < 125) continue; 

                const keyFactorR = Math.floor(r / 16) * 16;
                const keyFactorG = Math.floor(g / 16) * 16;
                const keyFactorB = Math.floor(b / 16) * 16;
                const hexStringStringValue = rgbComponentToHexString(keyFactorR, keyFactorG, keyFactorB);

                colorBucketsMap[hexStringStringValue] = (colorBucketsMap[hexStringStringValue] || 0) + 1;
            }

            let sortedClusters = Object.keys(colorBucketsMap).sort((a, b) => colorBucketsMap[b] - colorBucketsMap[a]);
            const targetCountLimit = parseInt(document.getElementById('slider-swatch-count').value);
            
            extractedDominantColorsHexCache = sortedClusters.slice(0, targetCountLimit);

            renderDominantSwatchesGrid();
            generateHarmonicSchemesFromDominantColor();
        }

        function renderDominantSwatchesGrid() {
            const container = document.getElementById('grid-dominant-swatches');
            container.innerHTML = '';

            extractedDominantColorsHexCache.forEach((hexValue) => {
                const card = document.createElement('div');
                card.className = "color-swatch-card bg-slate-900/60 border border-slate-850 p-2 rounded-xl flex flex-col gap-2 cursor-pointer select-none animate-fade-in relative overflow-hidden group";
                card.setAttribute('onclick', `copyHexStringStringValueToClipboard('${hexValue}', this)`);
                
                card.innerHTML = `
                    <div class="w-full aspect-[4/3] rounded-lg shadow-inner transition-transform group-hover:scale-[1.02]" style="background-color: ${hexValue};"></div>
                    <div class="flex items-center justify-between font-mono text-[10px] px-0.5">
                        <span class="font-bold text-slate-300 uppercase tracking-tight">${hexValue}</span>
                        <i class="fa-solid fa-copy text-slate-500 group-hover:text-teal-400 transition-colors"></i>
                    </div>
                    <div class="copied-indicator invisible absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center text-teal-400 text-[10px] uppercase font-bold tracking-widest font-mono transition-opacity opacity-0">Copied!</div>
                `;
                container.appendChild(card);
            });
        }

        function generateHarmonicSchemesFromDominantColor() {
            if (extractedDominantColorsHexCache.length === 0) return;
            
            const baseHexAnchor = extractedDominantColorsHexCache[0];
            const ruleValue = document.getElementById('select-harmony-rule').value;
            
            document.getElementById('harmony-scheme-title-lbl').innerText = `Harmonic ${ruleValue.replace('-', ' ')} Design Vectors`;

            const hslObj = hexStringToHSLConverter(baseHexAnchor);
            let computedHarmonicsArray = [];

            if (ruleValue === 'complementary') {
                computedHarmonicsArray.push(baseHexAnchor);
                const inverseHue = (hslObj.h + 180) % 360;
                computedHarmonicsArray.push(hslToHexStringConverter(inverseHue, hslObj.s, hslObj.l));
            } else if (ruleValue === 'analogous') {
                computedHarmonicsArray.push(hslToHexStringConverter((hslObj.h + 330) % 360, hslObj.s, hslObj.l));
                computedHarmonicsArray.push(baseHexAnchor);
                computedHarmonicsArray.push(hslToHexStringConverter((hslObj.h + 30) % 360, hslObj.s, hslObj.l));
            } else if (ruleValue === 'triadic') {
                computedHarmonicsArray.push(baseHexAnchor);
                computedHarmonicsArray.push(hslToHexStringConverter((hslObj.h + 120) % 360, hslObj.s, hslObj.l));
                computedHarmonicsArray.push(hslToHexStringConverter((hslObj.h + 240) % 360, hslObj.s, hslObj.l));
            } else if (ruleValue === 'split-complementary') {
                computedHarmonicsArray.push(baseHexAnchor);
                computedHarmonicsArray.push(hslToHexStringConverter((hslObj.h + 150) % 360, hslObj.s, hslObj.l));
                computedHarmonicsArray.push(hslToHexStringConverter((hslObj.h + 210) % 360, hslObj.s, hslObj.l));
            }

            let finalRenderSequence = [];
            computedHarmonicsArray.forEach(hex => {
                const subHsl = hexStringToHSLConverter(hex);
                finalRenderSequence.push(hslToHexStringConverter(subHsl.h, subHsl.s, Math.max(subHsl.l - 20, 12)));
                finalRenderSequence.push(hex);
                finalRenderSequence.push(hslToHexStringConverter(subHsl.h, subHsl.s, Math.min(subHsl.l + 20, 88)));
            });

            const harmonyContainer = document.getElementById('grid-harmonic-swatches');
            harmonyContainer.innerHTML = '';

            finalRenderSequence.forEach((hexValue) => {
                const card = document.createElement('div');
                card.className = "color-swatch-card bg-slate-900/60 border border-slate-800 p-2 rounded-xl flex flex-col gap-2 cursor-pointer select-none animate-fade-in relative overflow-hidden group";
                card.setAttribute('onclick', `copyHexStringStringValueToClipboard('${hexValue}', this)`);
                
                card.innerHTML = `
                    <div class="w-full aspect-[4/3] rounded-lg shadow-inner transition-transform group-hover:scale-[1.02]" style="background-color: ${hexValue};"></div>
                    <div class="flex items-center justify-between font-mono text-[9px] px-0.5">
                        <span class="font-bold text-slate-400 uppercase tracking-tight">${hexValue}</span>
                        <i class="fa-solid fa-copy text-slate-600 group-hover:text-teal-400 transition-colors"></i>
                    </div>
                    <div class="copied-indicator invisible absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center text-teal-400 text-[10px] uppercase font-bold tracking-widest font-mono transition-opacity opacity-0">Copied!</div>
                `;
                harmonyContainer.appendChild(card);
            });
            hideProcessingOverlay();
        }

        function rgbComponentToHexString(r, g, b) {
            return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
        }

        document.addEventListener('DOMContentLoaded', () => {
            hideProcessingOverlay();
        });

        function hexStringToHSLConverter(hex) {
            let r = parseInt(hex.slice(1, 3), 16) / 255;
            let g = parseInt(hex.slice(3, 5), 16) / 255;
            let b = parseInt(hex.slice(5, 7), 16) / 255;

            let max = Math.max(r, g, b), min = Math.min(r, g, b);
            let h, s, l = (max + min) / 2;

            if (max === min) {
                h = s = 0; 
            } else {
                let d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                    case g: h = (b - r) / d + 2; break;
                    case b: h = (r - g) / d + 4; break;
                }
                h /= 6;
            }
            return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
        }

        function hslToHexStringConverter(h, s, l) {
            h /= 360; s /= 100; l /= 100;
            let r, g, b;

            if (s === 0) {
                r = g = b = l; 
            } else {
                const hue2rgb = (p, q, t) => {
                    if (t < 0) t += 1;
                    if (t > 1) t -= 1;
                    if (t < 1/6) return p + (q - p) * 6 * t;
                    if (t < 1/2) return q;
                    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                    return p;
                };
                let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                let p = 2 * l - q;
                r = hue2rgb(p, q, h + 1/3);
                g = hue2rgb(p, q, h);
                b = hue2rgb(p, q, h - 1/3);
            }
            return rgbComponentToHexString(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255));
        }

        function copyHexStringStringValueToClipboard(textStr, elementDOMNode) {
            navigator.clipboard.writeText(textStr).then(() => {
                const indicator = elementDOMNode.querySelector('.copied-indicator');
                if (indicator) {
                    indicator.classList.remove('invisible');
                    indicator.classList.remove('opacity-0');
                    indicator.classList.add('opacity-100');
                    
                    setTimeout(() => {
                        indicator.classList.add('opacity-0');
                        indicator.classList.remove('opacity-100');
                        setTimeout(() => indicator.classList.add('invisible'), 200);
                    }, 800);
                }
            });
        }

        function purgeActivePalettePipeline() {
            window.location.reload();
        }