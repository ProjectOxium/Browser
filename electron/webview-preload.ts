import { webFrame } from 'electron'

try {
  const FINGERPRINTING_SCRIPT = `
(function() {
  var s = document.createElement('style');
  s.textContent = 'html { color-scheme: dark; } ::-webkit-scrollbar { width:7px } ::-webkit-scrollbar-track { background:#111 } ::-webkit-scrollbar-thumb { background:#3a3a3a; border-radius:4px }';
  document.head.appendChild(s);

  const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
  const originalToBlob = HTMLCanvasElement.prototype.toBlob;

  HTMLCanvasElement.prototype.toDataURL = function(...args) {
    const ctx = this.getContext('2d');
    if (ctx) {
      const imageData = ctx.getImageData(0, 0, 1, 1);
      imageData.data[0] += Math.floor(Math.random() * 2);
      ctx.putImageData(imageData, 0, 0);
    }
    return originalToDataURL.apply(this, args);
  };

  HTMLCanvasElement.prototype.toBlob = function(callback, ...args) {
    const ctx = this.getContext('2d');
    if (ctx) {
      const imageData = ctx.getImageData(0, 0, 1, 1);
      imageData.data[0] += Math.floor(Math.random() * 2);
      ctx.putImageData(imageData, 0, 0);
    }
    return originalToBlob.call(this, callback, ...args);
  };

  const FP_PARAMS = [0x1F00, 0x1F01, 0x1F02, 0x1F03, 0x9245, 0x9246, 0x9247, 0x9248, 0x8869, 0x886A, 0x8D62];
  const origGetParam = WebGLRenderingContext.prototype.getParameter;
  WebGLRenderingContext.prototype.getParameter = function(p) {
    if (FP_PARAMS.includes(p)) return 'Generic GPU';
    return origGetParam.apply(this, [p]);
  };
  const origGetParam2 = WebGL2RenderingContext.prototype.getParameter;
  WebGL2RenderingContext.prototype.getParameter = function(p) {
    if (FP_PARAMS.includes(p)) return 'Generic GPU';
    return origGetParam2.apply(this, [p]);
  };

  const origGetSupportedExt = WebGLRenderingContext.prototype.getSupportedExtensions;
  WebGLRenderingContext.prototype.getSupportedExtensions = function() {
    const exts = origGetSupportedExt.apply(this);
    return exts.filter(e => e !== 'WEBGL_debug_renderer_info');
  };

  Object.defineProperty(navigator, 'webdriver', { get: () => false });
  Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 4 });
  Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });

  const origGetFloatFreq = AnalyserNode.prototype.getFloatFrequencyData;
  AnalyserNode.prototype.getFloatFrequencyData = function(array) {
    origGetFloatFreq.call(this, array);
    for (let i = 0; i < array.length; i++) {
      array[i] += (Math.random() - 0.5) * 0.0001;
    }
  };
})();
`

  webFrame.executeJavaScript(FINGERPRINTING_SCRIPT)
} catch (e) {
  console.error('Oxium fingerprinting protection failed:', e)
}
