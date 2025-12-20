// --- [新增] 簡易驗證邏輯 ---
const correctUser = "abcde";  // ⚠️ 請修改您的帳號
const correctPass = "12345";   // ⚠️ 請修改您的密碼

function checkLogin() {
  const u = document.getElementById("loginUser").value;
  const p = document.getElementById("loginPass").value;
  const errorMsg = document.getElementById("loginError");
  const overlay = document.getElementById("loginOverlay");

  // 檢查是否符合
  if (u === correctUser && p === correctPass) {
    // 密碼正確：隱藏遮罩
    overlay.style.opacity = "0";
    overlay.style.transition = "opacity 0.5s";
    setTimeout(() => {
      overlay.style.display = "none";
    }, 500);
  } else {
    // 密碼錯誤：顯示紅字
    errorMsg.style.display = "block";
    
    // 加入錯誤震動效果
    document.querySelector(".login-card").animate([
      { transform: 'translateX(0)' },
      { transform: 'translateX(-10px)' },
      { transform: 'translateX(10px)' },
      { transform: 'translateX(0)' }
    ], { duration: 300 });
  }
}

// --- 全域變數 ---
let files = [];
let previewImg = new Image();
let currentMode = "single";
let currentPos = "middle-center";
let usageMode = "general"; // 'general' | 'idcard'
let isLoaded = false;
let savedColor = "#FF0000";

let lastJobSignature = null;
let lastOutputName = "";

const canvas = document.getElementById("previewCanvas");
const ctx = canvas.getContext("2d");
const maskBox = document.getElementById("safeZoneBox");

// 色票
const themeColors = [
  [
    "#FFFFFF",
    "#000000",
    "#E7E6E6",
    "#44546A",
    "#5B9BD5",
    "#ED7D31",
    "#A5A5A5",
    "#FFC000",
    "#4472C4",
    "#70AD47",
  ],
  [
    "#F2F2F2",
    "#7F7F7F",
    "#D0CECE",
    "#D6DCE4",
    "#DEEBF6",
    "#FBE5D5",
    "#EDEDED",
    "#FFF2CC",
    "#D9E1F2",
    "#E2EFDA",
  ],
  [
    "#D9D9D9",
    "#595959",
    "#AEABAB",
    "#ADB9CA",
    "#BDD7EE",
    "#F8CBAD",
    "#DBDBDB",
    "#FFE699",
    "#B4C6E7",
    "#C6E0B4",
  ],
  [
    "#BFBFBF",
    "#3F3F3F",
    "#757171",
    "#8497B0",
    "#9CC2E5",
    "#F4B084",
    "#C9C9C9",
    "#FFD966",
    "#8EA9DB",
    "#A9D08E",
  ],
  [
    "#A6A6A6",
    "#262626",
    "#3A3838",
    "#333F4F",
    "#2F5597",
    "#C65911",
    "#7B7B7B",
    "#BF9000",
    "#305496",
    "#548235",
  ],
  [
    "#7F7F7F",
    "#0C0C0C",
    "#161616",
    "#222B35",
    "#203764",
    "#833C0C",
    "#525252",
    "#806000",
    "#203864",
    "#375623",
  ],
];
const standardColors = [
  "#C00000",
  "#FF0000",
  "#FFC000",
  "#FFFF00",
  "#92D050",
  "#00B050",
  "#00B0F0",
  "#0070C0",
  "#002060",
  "#7030A0",
];

document.addEventListener("DOMContentLoaded", () => {
  syncColor("hex");
  initColorGrid();
  document.addEventListener("click", (e) => {
    if (!document.querySelector(".color-control-wrapper").contains(e.target)) {
      document.getElementById("colorPopup").style.display = "none";
    }
  });

  initDraggableMask();
  const resizeObserver = new ResizeObserver(() => update());
  resizeObserver.observe(maskBox);
});

// --- 8方向拖曳與縮放 ---
function initDraggableMask() {
  let state = null; // 'move' 或 'resize'
  let resizeDir = "";

  let startX, startY;
  let startLeft, startTop, startWidth, startHeight;

  const startAction = (e) => {
    if (e.target.classList.contains("resize-handle")) {
      state = "resize";
      resizeDir = e.target.getAttribute("data-dir");
    } else if (
      e.target.id === "safeZoneBox" ||
      e.target.parentNode.id === "safeZoneBox"
    ) {
      state = "move";
    } else {
      return;
    }

    const clientX = e.type.includes("touch") ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.includes("touch") ? e.touches[0].clientY : e.clientY;

    startX = clientX;
    startY = clientY;

    startLeft = maskBox.offsetLeft;
    startTop = maskBox.offsetTop;
    startWidth = maskBox.offsetWidth;
    startHeight = maskBox.offsetHeight;

    e.preventDefault();
  };

  const doAction = (e) => {
    if (!state) return;
    const clientX = e.type.includes("touch") ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.includes("touch") ? e.touches[0].clientY : e.clientY;

    const dx = clientX - startX;
    const dy = clientY - startY;

    if (state === "move") {
      let newLeft = startLeft + dx;
      let newTop = startTop + dy;
      const maxLeft = canvas.clientWidth - startWidth;
      const maxTop = canvas.clientHeight - startHeight;

      if (newLeft < 0) newLeft = 0;
      if (newTop < 0) newTop = 0;
      if (newLeft > maxLeft) newLeft = maxLeft;
      if (newTop > maxTop) newTop = maxTop;

      maskBox.style.left = newLeft + "px";
      maskBox.style.top = newTop + "px";
    } else if (state === "resize") {
      let newW = startWidth;
      let newH = startHeight;
      let newL = startLeft;
      let newT = startTop;

      if (resizeDir.includes("e")) newW = startWidth + dx;
      if (resizeDir.includes("w")) {
        newW = startWidth - dx;
        newL = startLeft + dx;
      }
      if (resizeDir.includes("s")) newH = startHeight + dy;
      if (resizeDir.includes("n")) {
        newH = startHeight - dy;
        newT = startTop + dy;
      }

      if (newW < 20) {
        if (resizeDir.includes("w")) newL = startLeft + startWidth - 20;
        newW = 20;
      }
      if (newH < 20) {
        if (resizeDir.includes("n")) newT = startTop + startHeight - 20;
        newH = 20;
      }

      if (newL < 0) {
        newW += newL;
        newL = 0;
      }
      if (newT < 0) {
        newH += newT;
        newT = 0;
      }
      if (newL + newW > canvas.clientWidth) newW = canvas.clientWidth - newL;
      if (newT + newH > canvas.clientHeight) newH = canvas.clientHeight - newT;

      maskBox.style.width = newW + "px";
      maskBox.style.height = newH + "px";
      maskBox.style.left = newL + "px";
      maskBox.style.top = newT + "px";
    }
    update();
  };

  const stopAction = () => {
    state = null;
  };

  maskBox.addEventListener("mousedown", startAction);
  maskBox.addEventListener("touchstart", startAction);
  window.addEventListener("mousemove", doAction);
  window.addEventListener("touchmove", doAction, { passive: false });
  window.addEventListener("mouseup", stopAction);
  window.addEventListener("touchend", stopAction);
}

// --- 用途模式切換 ---
function setUsageMode(mode) {
  usageMode = mode;
  document.getElementById("btnModeGeneral").className =
    mode === "general" ? "mode-btn active" : "mode-btn";
  document.getElementById("btnModeID").className =
    mode === "idcard" ? "mode-btn active" : "mode-btn";
  document.getElementById("idModeHint").style.display =
    mode === "idcard" ? "block" : "none";

  maskBox.style.display = mode === "idcard" && isLoaded ? "block" : "none";
  if (mode === "idcard") setMode("tiled");
  else setMode("single");
  update();
}

function handleFiles() {
  const input = document.getElementById("fileInput");
  files = Array.from(input.files);
  lastJobSignature = null;
  if (files.length === 0) return;

  document.getElementById(
    "fileInfo"
  ).innerText = `已選擇 ${files.length} 個檔案`;
  document.getElementById("dlBtn").disabled = false;
  document.getElementById("welcomeMsg").style.display = "none";

  if (files[0].type === "application/pdf") {
    renderPdfToPreview(files[0]);
  } else {
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
    };
    reader.readAsDataURL(files[0]);
  }

  previewImg.onload = () => {
    isLoaded = true;
    if (usageMode === "idcard") maskBox.style.display = "block";
    update();
    
    // [手機版優化] 載入後自動捲回頂端預覽
    if (window.innerWidth <= 768) {
      document.getElementById("previewPane").scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  };
}

async function renderPdfToPreview(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1.5 });
    const c = document.createElement("canvas");
    const cx = c.getContext("2d");
    c.width = viewport.width;
    c.height = viewport.height;
    await page.render({ canvasContext: cx, viewport: viewport }).promise;
    previewImg.src = c.toDataURL("image/jpeg");
  } catch (e) {
    console.error(e);
    previewImg.src = createWhitePlaceholder(600, 800);
  }
}

function createWhitePlaceholder(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const cx = c.getContext("2d");
  cx.fillStyle = "white";
  cx.fillRect(0, 0, w, h);
  return c.toDataURL();
}

function setMode(mode) {
  currentMode = mode;
  document.getElementById("btnSingle").className =
    mode === "single" ? "mode-btn active" : "mode-btn";
  document.getElementById("btnTiled").className =
    mode === "tiled" ? "mode-btn active" : "mode-btn";
  document.getElementById("singleControls").style.display =
    mode === "single" ? "block" : "none";
  document.getElementById("tiledControls").style.display =
    mode === "tiled" ? "block" : "none";
  update();
}

function setPos(pos) {
  currentPos = pos;
  document
    .querySelectorAll(".grid-btn")
    .forEach((b) => b.classList.remove("active"));
  const t = document.getElementById("btn-" + pos);
  if (t) t.classList.add("active");
  update();
}

function syncNum(id, val) {
  document.getElementById(id + "Num").value = val;
  update();
}
function syncRange(id, val) {
  document.getElementById(id + "Range").value = val;
  update();
}

function initColorGrid() {
  const tG = document.getElementById("themeColorGrid");
  const sG = document.getElementById("standardColorGrid");
  themeColors.forEach((r) => r.forEach((c) => tG.appendChild(createSwatch(c))));
  standardColors.forEach((c) => sG.appendChild(createSwatch(c)));
}
function createSwatch(c) {
  const d = document.createElement("div");
  d.className = "swatch";
  d.style.backgroundColor = c;
  d.title = c;
  d.onmouseenter = () => tempUpdatePreview(c);
  d.onmouseleave = () => tempUpdatePreview(savedColor);
  d.onclick = () => {
    savedColor = c;
    updateInputValues(c);
    toggleColorMenu();
    update();
  };
  return d;
}
function toggleColorMenu() {
  const p = document.getElementById("colorPopup");
  p.style.display = p.style.display === "none" ? "block" : "none";
  if (p.style.display === "block")
    savedColor = document.getElementById("colorHex").value;
}
function toggleCustomColor() {
  const p = document.getElementById("customColorPanel");
  p.style.display = p.style.display === "none" ? "block" : "none";
}
function tempUpdatePreview(hex) {
  document.getElementById("colorHex").value = hex;
  document.getElementById("currentColorBox").style.borderBottomColor = hex;
  document.getElementById("currentColorBox").style.color = hex;
  update();
}
function updateInputValues(hex) {
  document.getElementById("colorHex").value = hex;
  const rgb = hexToRgb(hex);
  document.getElementById("colorR").value = rgb.r;
  document.getElementById("colorG").value = rgb.g;
  document.getElementById("colorB").value = rgb.b;
  document.getElementById("currentColorBox").style.borderBottomColor = hex;
  document.getElementById("currentColorBox").style.color = hex;
}
function syncColor(src) {
  const picker = document.getElementById("colorPicker");
  const hexIn = document.getElementById("colorHex");
  const rIn = document.getElementById("colorR");
  const gIn = document.getElementById("colorG");
  const bIn = document.getElementById("colorB");
  let r, g, b, hex;
  if (src === "picker") {
    hex = picker.value;
    const c = hexToRgb(hex);
    r = c.r;
    g = c.g;
    b = c.b;
  } else if (src === "hex") {
    hex = hexIn.value;
    if (!/^#[0-9A-F]{6}$/i.test(hex)) return;
    const c = hexToRgb(hex);
    r = c.r;
    g = c.g;
    b = c.b;
  } else if (src === "rgb") {
    r = parseInt(rIn.value) || 0;
    g = parseInt(gIn.value) || 0;
    b = parseInt(bIn.value) || 0;
    hex = rgbToHex(r, g, b);
  }
  if (src !== "picker") picker.value = hex;
  if (src !== "hex") hexIn.value = hex;
  if (src !== "rgb") {
    rIn.value = r;
    gIn.value = g;
    bIn.value = b;
  }
  savedColor = hex;
  document.getElementById("currentColorBox").style.borderBottomColor = hex;
  document.getElementById("currentColorBox").style.color = hex;
  update();
}

function getParams() {
  let mask = null;
  if (usageMode === "idcard" && maskBox.style.display !== "none") {
    const rect = maskBox.getBoundingClientRect();
    mask = {
      x: maskBox.offsetLeft / canvas.clientWidth,
      y: maskBox.offsetTop / canvas.clientHeight,
      w: maskBox.offsetWidth / canvas.clientWidth,
      h: maskBox.offsetHeight / canvas.clientHeight,
    };
  }

  return {
    text: document.getElementById("wmText").value,
    font: document.getElementById("wmFont").value,
    color: document.getElementById("colorHex").value,
    size: parseInt(document.getElementById("sizeNum").value),
    rotate: parseInt(document.getElementById("rotNum").value),
    opacity: parseInt(document.getElementById("opNum").value) / 100,
    gap: parseInt(document.getElementById("gapNum").value),
    pos: currentPos,
    mask: mask,
  };
}

// 核心繪圖函式 (修正版：正確的挖空邏輯)
function applyWatermarkToCanvas(targetCtx, width, height, p) {
  const basePx = width / 20;
  const fontSize = basePx * (p.size / 50);

  targetCtx.save();

  // 如果有遮罩，定義裁切區域
  if (p.mask) {
    targetCtx.beginPath();
    // 1. 畫出整個畫布矩形
    targetCtx.rect(0, 0, width, height);

    // 2. 畫出遮罩矩形
    const mx = p.mask.x * width;
    const my = p.mask.y * height;
    const mw = p.mask.w * width;
    const mh = p.mask.h * height;
    targetCtx.rect(mx, my, mw, mh);

    // 3. 使用 evenodd 規則：兩個矩形重疊處會變成"洞" (不繪製)
    targetCtx.clip("evenodd");
  }

  targetCtx.font = `bold ${fontSize}px "${p.font}"`;
  targetCtx.fillStyle = p.color;
  targetCtx.globalAlpha = p.opacity;
  targetCtx.textBaseline = "middle";
  targetCtx.textAlign = "center";

  if (currentMode === "single") {
    const textW = targetCtx.measureText(p.text).width;
    let x, y;
    const [v, h] = p.pos.split("-");
    const margin = fontSize;
    if (h === "left") x = margin + textW / 2;
    else if (h === "right") x = width - margin - textW / 2;
    else x = width / 2;
    if (v === "top") y = margin + fontSize / 2;
    else if (v === "bottom") y = height - margin - fontSize / 2;
    else y = height / 2;
    targetCtx.translate(x, y);
    targetCtx.rotate((p.rotate * Math.PI) / 180);
    targetCtx.fillText(p.text, 0, 0);
  } else {
    const gapPx = (p.gap / 100) * fontSize * 4;
    const cols = Math.ceil(width / gapPx) + 2;
    const rows = Math.ceil(height / gapPx) + 2;
    for (let i = -1; i < cols; i++) {
      for (let j = -1; j < rows; j++) {
        const x = i * gapPx;
        let y = j * gapPx;
        if (j % 2 !== 0) xOffset = gapPx / 2;
        else xOffset = 0;
        targetCtx.save();
        targetCtx.translate(x + xOffset, y);
        targetCtx.rotate((p.rotate * Math.PI) / 180);
        targetCtx.fillText(p.text, 0, 0);
        targetCtx.restore();
      }
    }
  }
  targetCtx.restore();
  targetCtx.globalAlpha = 1.0;
}

function update() {
  if (!isLoaded) return;
  const maxDisplayW = 800;
  let scale = 1;
  if (previewImg.width > maxDisplayW) scale = maxDisplayW / previewImg.width;

  canvas.width = previewImg.width * scale;
  canvas.height = previewImg.height * scale;
  ctx.drawImage(previewImg, 0, 0, canvas.width, canvas.height);

  applyWatermarkToCanvas(ctx, canvas.width, canvas.height, getParams());
}

function generateCurrentSignature(p, outName, outFormat) {
  const fileFeatures = files.map((f) => `${f.name}-${f.size}`).join("|");
  const paramsStr = JSON.stringify(p);
  return `${fileFeatures}__${paramsStr}__${outName}_${outFormat}`;
}

async function processAll() {
  const btn = document.getElementById("dlBtn");
  const msg = document.getElementById("statusMsg");
  if (btn.disabled) return;
  let outName =
    document.getElementById("outputFileName").value || "watermarked_output";
  const outFormat = document.getElementById("outputFormat").value;
  const p = getParams();

  const currentSignature = generateCurrentSignature(p, outName, outFormat);
  if (currentSignature === lastJobSignature) {
    if (
      !confirm(
        `系統提示：\n\n您剛剛已經下載過內容完全相同的檔案了！\n前次檔名為：${lastOutputName}\n\n確定要重新執行並下載嗎？`
      )
    )
      return;
  }
  btn.disabled = true;
  btn.innerText = "處理中...";
  let finalDownloadName = "";

  try {
    const zip = new JSZip();
    let singleResultBlob = null;
    let singleResultExt = null;
    let totalOutputCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      msg.innerText = `正在處理 (${i + 1}/${files.length}): ${file.name}`;

      if (file.type === "application/pdf") {
        if (outFormat === "png" || outFormat === "jpg") {
          const mime = outFormat === "jpg" ? "image/jpeg" : "image/png";
          const blobs = await processPdfToImages(file, p, mime);
          blobs.forEach((blob, index) => {
            const nameParts = file.name.split(".");
            nameParts.pop();
            const pageNum = (index + 1).toString().padStart(2, "0");
            zip.file(
              `${nameParts.join(".")}_page_${pageNum}.${outFormat}`,
              blob
            );
          });
          totalOutputCount += blobs.length;
        } else {
          const blob = await processPDF(file, p);
          const nameParts = file.name.split(".");
          nameParts.pop();
          zip.file(`${nameParts.join(".")}_wm.pdf`, blob);
          if (files.length === 1) {
            singleResultBlob = blob;
            singleResultExt = "pdf";
          }
          totalOutputCount++;
        }
      } else {
        let ext, blob;
        if (outFormat === "pdf") {
          const imgBlob = await processImage(file, p, "image/jpeg");
          blob = await createPdfFromImage(imgBlob);
          ext = "pdf";
        } else {
          let mimeType = file.type;
          if (outFormat === "jpg") mimeType = "image/jpeg";
          if (outFormat === "png") mimeType = "image/png";
          blob = await processImage(file, p, mimeType);
          if (outFormat !== "auto") ext = outFormat;
          else ext = file.type.split("/")[1];
          if (ext === "jpeg") ext = "jpg";
        }
        const nameParts = file.name.split(".");
        nameParts.pop();
        zip.file(`${nameParts.join(".")}_wm.${ext}`, blob);
        if (files.length === 1) {
          singleResultBlob = blob;
          singleResultExt = ext;
        }
        totalOutputCount++;
      }
    }
    if (files.length === 1 && totalOutputCount === 1) {
      finalDownloadName = `${outName}.${singleResultExt}`;
      await saveFile(singleResultBlob, finalDownloadName, singleResultExt);
    } else {
      msg.innerText = "打包壓縮中...";
      const content = await zip.generateAsync({ type: "blob" });
      finalDownloadName = `${outName}.zip`;
      await saveFile(content, finalDownloadName, "zip");
    }
    lastJobSignature = currentSignature;
    lastOutputName = finalDownloadName;
    msg.innerText = "完成！";
  } catch (error) {
    console.error(error);
    msg.innerText = "發生錯誤: " + error.message;
  } finally {
    btn.disabled = false;
    btn.innerText = "另存新檔";
  }
}

async function processPdfToImages(file, p, mimeType) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
  const outputBlobs = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: context, viewport: viewport }).promise;
    applyWatermarkToCanvas(context, canvas.width, canvas.height, p);
    const blob = await new Promise((r) => canvas.toBlob(r, mimeType, 0.9));
    outputBlobs.push(blob);
  }
  return outputBlobs;
}

async function createPdfFromImage(imgBlob) {
  const pdfDoc = await PDFLib.PDFDocument.create();
  const imgBytes = await imgBlob.arrayBuffer();
  let imgEmbed;
  if (imgBlob.type === "image/png") imgEmbed = await pdfDoc.embedPng(imgBytes);
  else imgEmbed = await pdfDoc.embedJpg(imgBytes);
  const page = pdfDoc.addPage([imgEmbed.width, imgEmbed.height]);
  page.drawImage(imgEmbed, {
    x: 0,
    y: 0,
    width: imgEmbed.width,
    height: imgEmbed.height,
  });
  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
}

function processImage(file, p, mimeType = null) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const c = document.createElement("canvas");
      const x = c.getContext("2d");
      c.width = img.width;
      c.height = img.height;
      x.drawImage(img, 0, 0);
      applyWatermarkToCanvas(x, c.width, c.height, p);
      const outputType = mimeType || file.type;
      c.toBlob((b) => resolve(b), outputType, 0.9);
    };
  });
}

async function processPDF(file, p) {
  const buffer = await file.arrayBuffer();
  const pdfDoc = await PDFLib.PDFDocument.load(buffer);
  const pages = pdfDoc.getPages();
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;
    applyWatermarkToCanvas(ctx, width, height, p);
    const pngBlob = await new Promise((r) => canvas.toBlob(r, "image/png"));
    const pngImageBytes = await pngBlob.arrayBuffer();
    const embeddedImage = await pdfDoc.embedPng(pngImageBytes);
    page.drawImage(embeddedImage, { x: 0, y: 0, width: width, height: height });
  }
  const saved = await pdfDoc.save();
  return new Blob([saved], { type: "application/pdf" });
}

async function saveFile(blob, suggestedName, ext) {
  if ("showSaveFilePicker" in window) {
    try {
      const types = [];
      if (ext === "pdf")
        types.push({
          description: "PDF 文件",
          accept: { "application/pdf": [".pdf"] },
        });
      else if (ext === "zip")
        types.push({
          description: "ZIP 壓縮檔",
          accept: { "application/zip": [".zip"] },
        });
      else if (ext === "jpg")
        types.push({
          description: "JPG 圖片",
          accept: { "image/jpeg": [".jpg"] },
        });
      else if (ext === "png")
        types.push({
          description: "PNG 圖片",
          accept: { "image/png": [".png"] },
        });
      else types.push({ description: "檔案", accept: { "*/*": ["." + ext] } });
      const handle = await window.showSaveFilePicker({ suggestedName, types });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (err) {
      if (err.name === "AbortError") return;
    }
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = suggestedName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function hexToRgb(hex) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}
function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
