alert(`🎵 Welcome to Sangeet\n\n• Your music never leaves your computer.\n• Nothing is uploaded.\n• Select a folder and enjoy.\n\nHappy Listening ❤️`);

// ==========================================================
// STATE VARIABLES
// ==========================================================
let currentsong = new Audio();
let songs = [];
let userFolders = [];
let currentFolder = "";
let currentIndex = 0;
let currentObjectUrl = null;
let isDragging = false;

// Playback Modes
let isShuffle = false;
let isRepeat = false;
let previousVolume = 1;

// ==========================================================
// DOM ELEMENTS
// ==========================================================
const playBtn = document.getElementById("playing");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const shuffleBtn = document.getElementById("shuffle");
const repeatBtn = document.getElementById("repeat");

const songList = document.querySelector(".songlist");
const folderTitle = document.querySelector(".foldername span");
const cardContainer = document.querySelector(".cardContainer");
const songInfo = document.querySelector(".songinfo");
const albumCover = document.querySelector(".albumCover");

const currentTime = document.querySelector(".currenttime");
const duration = document.querySelector(".songduration");
const seekbar = document.querySelector(".seekbar");
const trail = document.querySelector(".trail");
const circle = document.querySelector(".circle");

const loader = document.getElementById("loader");
const sidebar = document.querySelector(".sidebar");
const overlay = document.querySelector(".mobileOverlay");
const menuBtn = document.querySelector(".menuBtn");
const closeSidebarBtn = document.querySelector(".closeSidebar");

// ==========================================================
// INDEXED-DB HELPER (For saving the folder handle)
// ==========================================================
const dbHelper = {
    async getDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open("SangeetDB", 1);
            request.onupgradeneeded = (e) => e.target.result.createObjectStore("settings");
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = () => reject("IndexedDB error");
        });
    },
    async set(key, val) {
        const db = await this.getDB();
        db.transaction("settings", "readwrite").objectStore("settings").put(val, key);
    },
    async get(key) {
        const db = await this.getDB();
        return new Promise(resolve => {
            const request = db.transaction("settings").objectStore("settings").get(key);
            request.onsuccess = () => resolve(request.result);
        });
    }
};

/**
 * Request permission from the user to re-access their saved folder
 */
async function verifyPermission(fileHandle) {
    const options = { mode: 'read' };
    if ((await fileHandle.queryPermission(options)) === 'granted') {
        return true;
    }
    if ((await fileHandle.requestPermission(options)) === 'granted') {
        return true;
    }
    return false;
}

// ==========================================================
// UTILITY FUNCTIONS
// ==========================================================
function showToast(message) {
    const toast = document.getElementById("toast");
    toast.querySelector("p").textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timeout);
    showToast.timeout = setTimeout(() => toast.classList.remove("show"), 2800);
}

function closeMenu() {
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
}

if (menuBtn) menuBtn.addEventListener("click", () => {
    sidebar.classList.add("open");
    overlay.classList.add("show");
});
if (closeSidebarBtn) closeSidebarBtn.addEventListener("click", closeMenu);
if (overlay) overlay.addEventListener("click", closeMenu);

function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function cleanSongName(name) { return decodeURI(name).replace(/\.[^/.]+$/, "").replace(/[_\-]+/g, " ").replace(/\s+/g, " ").trim(); }
function cleanFolderName(folder) { return decodeURI(folder).replace(/[_\-]+/g, " ").replace(/\s+/g, " ").trim(); }
function isAudioFile(file) { return file.type.startsWith("audio/") || /\.(mp3|wav|ogg|aac|flac|m4a)$/i.test(file.name); }
function supportsFolderPicker() { return "showDirectoryPicker" in window; }

function randomGradient() {
    const gradients = [
        "linear-gradient(135deg,#8B5CF6,#06B6D4)", "linear-gradient(135deg,#ff6b6b,#ff9f43)",
        "linear-gradient(135deg,#4facfe,#00f2fe)", "linear-gradient(135deg,#43e97b,#38f9d7)",
        "linear-gradient(135deg,#fa709a,#fee140)", "linear-gradient(135deg,#30cfd0,#330867)"
    ];
    return gradients[Math.floor(Math.random() * gradients.length)];
}

// ==========================================================
// CORE PLAYER LOGIC
// ==========================================================
function loadSong(file) {
    if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = URL.createObjectURL(file);
    currentsong.src = currentObjectUrl;
}

function playMusic(file, pause = false) {
    currentIndex = songs.indexOf(file);
    loadSong(file);

    songInfo.textContent = cleanSongName(file.name);
    requestAnimationFrame(() => {
        songInfo.classList.remove("marquee");
        if (songInfo.scrollWidth > songInfo.parentElement.clientWidth) {
            songInfo.classList.add("marquee");
        }
    });

    currentTime.textContent = "00:00";
    duration.textContent = "00:00";

    if (!pause) {
        currentsong.play();
        playBtn.innerHTML = `<i class="ri-pause-fill"></i>`;
    }
    updateActiveSongHighlight();
}

function updateActiveSongHighlight() {
    const allItems = document.querySelectorAll(".songlist li");
    allItems.forEach(item => item.classList.remove("active"));
    const currentItem = document.querySelector(`.songlist li[data-index="${currentIndex}"]`);
    if (currentItem) {
        currentItem.classList.add("active");
        currentItem.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
}

async function getSongs(folder) {
    currentFolder = folder;
    folderTitle.textContent = cleanFolderName(folder);
    songs.sort((a, b) => cleanSongName(a.name).localeCompare(cleanSongName(b.name), undefined, { numeric: true, sensitivity: "base" }));
    songList.innerHTML = "";
    songs.forEach((file, index) => {
        songList.innerHTML += `<li data-index="${index}"><div class="info">${cleanSongName(file.name)}</div></li>`;
    });
    Array.from(songList.children).forEach(item => {
        item.addEventListener("click", () => playMusic(songs[item.dataset.index]));
    });
}

async function displayAlbums() {
    cardContainer.innerHTML = "";
    userFolders.forEach(folder => {
        cardContainer.innerHTML += `
        <div class="card" data-folder="${folder.name}">
            <div class="foldersvg" style="background:${randomGradient()}"></div>
            <div class="cardname">
                <h2>${cleanFolderName(folder.name)}</h2>
                <p>${folder.songs.length} Songs</p>
            </div>
        </div>`;
    });

    document.querySelectorAll(".card").forEach(card => {
        card.onclick = async () => {
            const folder = card.dataset.folder;
            songs = userFolders.find(f => f.name === folder).songs;
            await getSongs(folder);
            playMusic(songs[0]);
            showToast(`${cleanFolderName(folder)} loaded`);
        };
    });
}

// ==========================================================
// DIRECTORY PROCESSING LOGIC
// ==========================================================
/**
 * Takes a directory handle, reads all audio files, and updates the UI
 */
async function processDirectoryHandle(directoryHandle) {
    loader.style.display = "flex";
    const collectedFiles = [];

    try {
        async function walk(handle, path = "") {
            for await (const entry of handle.values()) {
                if (entry.kind === "file") {
                    const file = await entry.getFile();
                    if (isAudioFile(file)) collectedFiles.push({ file, path: `${path}${file.name}` });
                } else if (entry.kind === "directory") {
                    await walk(entry, `${path}${entry.name}/`);
                }
            }
        }

        await walk(directoryHandle);

        if (collectedFiles.length === 0) {
            loader.style.display = "none";
            return showToast("No audio files found.");
        }

        const folderMap = {};
        collectedFiles.forEach(({ file, path }) => {
            const folder = path.split("/")[0] || "Music";
            if (!folderMap[folder]) folderMap[folder] = [];
            folderMap[folder].push(file);
        });

        userFolders = Object.keys(folderMap)
            .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }))
            .map(folder => ({ name: folder, songs: folderMap[folder] }));

        songs = userFolders[0].songs;
        await getSongs(userFolders[0].name);
        displayAlbums();
        playMusic(songs[0], true); // Load first song paused
        showToast(`${songs.length} songs loaded`);

    } catch (error) {
        console.error(error);
        showToast("Error reading files.");
    } finally {
        loader.style.display = "none";
    }
}


// ==========================================================
// MAIN INITIALIZATION & EVENT LISTENERS
// ==========================================================

async function main() {
    loader.style.display = "flex";
    setTimeout(() => { loader.style.display = "none"; }, 1200);

    const uploadBtn = document.getElementById("pickFolder");
    let savedHandle = null;

    // --- 1. Check for saved folder on page load ---
    if (supportsFolderPicker()) {
        try {
            savedHandle = await dbHelper.get("musicFolderHandle");
            if (savedHandle) {
                // Check if the browser already remembers our permission silently
                if ((await savedHandle.queryPermission({ mode: 'read' })) === 'granted') {
                    await processDirectoryHandle(savedHandle);
                } else {
                    // We need a user click to ask for permission! Update the UI.
                    uploadBtn.innerHTML = `<i class="ri-history-line"></i><span>Restore Library</span>`;
                    showToast("Previous library found. Click Restore.");
                }
            }
        } catch (error) {
            console.log("No saved folder found.");
        }
    }

    // --- 2. Upload / Restore Button Logic ---
    uploadBtn.addEventListener("click", async () => {
        if (supportsFolderPicker() && window.showDirectoryPicker) {
            try {
                // If the button is in "Restore" mode, verify permission for the saved handle
                if (savedHandle && (await savedHandle.queryPermission({ mode: 'read' })) !== 'granted') {
                    const hasPermission = await verifyPermission(savedHandle);
                    if (hasPermission) {
                        await processDirectoryHandle(savedHandle);
                        // Reset button UI back to normal
                        uploadBtn.innerHTML = `<i class="ri-folder-open-fill"></i><span>Upload</span>`;
                    }
                    return; // Stop here so we don't open the file picker
                }

                // Otherwise, act like a normal Upload button
                const directoryHandle = await window.showDirectoryPicker();
                await dbHelper.set("musicFolderHandle", directoryHandle);
                savedHandle = directoryHandle; // Update our local variable
                await processDirectoryHandle(directoryHandle);
                uploadBtn.innerHTML = `<i class="ri-folder-open-fill"></i><span>Upload</span>`;
            } catch (err) {
                if (err.name !== "AbortError") console.error(err);
            }
            return;
        }
        // Fallback for older browsers
        document.getElementById("fileInput").click();
    });

    // --- 3. Fallback Input Handler ---
    document.getElementById("fileInput").addEventListener("change", e => {
        const files = Array.from(e.target.files);
        const folderMap = {};

        files.forEach(file => {
            if (!isAudioFile(file)) return;
            const parts = file.webkitRelativePath.split("/");
            const folder = parts.length > 2 ? parts[1] : parts[0];
            if (!folderMap[folder]) folderMap[folder] = [];
            folderMap[folder].push(file);
        });

        userFolders = Object.keys(folderMap).filter(folder => folderMap[folder].length)
            .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }))
            .map(folder => ({ name: folder, songs: folderMap[folder] }));

        if (!userFolders.length) return showToast("No valid audio files found.");

        songs = userFolders[0].songs;
        getSongs(userFolders[0].name);
        displayAlbums();
        playMusic(songs[0], true);
        showToast(`${songs.length} songs loaded`);
    });

    // --- Play / Pause Control ---
    playBtn.addEventListener("click", () => {
        if (!currentsong.src) return;
        if (currentsong.paused) {
            currentsong.play();
            playBtn.innerHTML = `<i class="ri-pause-fill"></i>`;
        } else {
            currentsong.pause();
            playBtn.innerHTML = `<i class="ri-play-fill"></i>`;
        }
    });

    // --- Playback Modes ---
    shuffleBtn.addEventListener("click", () => {
        isShuffle = !isShuffle;
        shuffleBtn.style.color = isShuffle ? "#06B6D4" : "white";
    });

    repeatBtn.addEventListener("click", () => {
        isRepeat = !isRepeat;
        repeatBtn.style.color = isRepeat ? "#06B6D4" : "white";
    });

    // --- Navigation Logic ---
    function playNextSong(isAutoPlay = false) {
        if (songs.length === 0) return;
        if (isAutoPlay && isRepeat) {
            playMusic(songs[currentIndex]);
            return;
        }
        if (isShuffle) {
            let nextIndex = currentIndex;
            while (nextIndex === currentIndex && songs.length > 1) {
                nextIndex = Math.floor(Math.random() * songs.length);
            }
            playMusic(songs[nextIndex]);
        } else if (currentIndex + 1 < songs.length) {
            playMusic(songs[currentIndex + 1]);
        } else {
            if (isAutoPlay) playBtn.innerHTML = `<i class="ri-play-fill"></i>`;
            else playMusic(songs[0]);
        }
    }

    prevBtn.addEventListener("click", () => {
        if (currentIndex > 0) playMusic(songs[currentIndex - 1]);
        else if (songs.length > 0) playMusic(songs[songs.length - 1]);
    });

    nextBtn.addEventListener("click", () => playNextSong(false));
    currentsong.addEventListener("ended", () => playNextSong(true));

    // --- Disc Rotation Animations ---
    currentsong.addEventListener("play", () => albumCover.classList.add("is-playing"));
    currentsong.addEventListener("pause", () => albumCover.classList.remove("is-playing"));

    // --- Timeline Updates & Seeking ---
    currentsong.addEventListener("timeupdate", () => {
        const total = Number.isFinite(currentsong.duration) ? currentsong.duration : 0;
        const progress = total > 0 ? (currentsong.currentTime / total) * 100 : 0;
        currentTime.textContent = formatTime(currentsong.currentTime);
        duration.textContent = formatTime(total);
        trail.style.width = progress + "%";
        circle.style.left = progress + "%";
    });

    function seek(clientX) {
        if (!Number.isFinite(currentsong.duration)) return;
        const rect = seekbar.getBoundingClientRect();
        let percent = ((clientX - rect.left) / rect.width) * 100;
        percent = Math.max(0, Math.min(100, percent));
        trail.style.width = percent + "%";
        circle.style.left = percent + "%";
        currentsong.currentTime = (currentsong.duration * percent) / 100;
    }

    seekbar.onclick = e => seek(e.clientX);
    circle.onmousedown = () => { isDragging = true; };
    document.onmousemove = e => { if (isDragging) seek(e.clientX); };
    document.onmouseup = () => { isDragging = false; };

    circle.ontouchstart = () => { isDragging = true; };
    document.ontouchmove = e => { if (isDragging) seek(e.touches[0].clientX); };
    document.ontouchend = () => { isDragging = false; };

    // --- Volume & Mute Control ---
    const volumeSlider = document.querySelector(".range");
    const volumeBtn = document.querySelector(".volumeIcon");
    const volumeIcon = volumeBtn.querySelector("i");
    currentsong.volume = 1;

    function updateVolumeIcon(val) {
        if (val == 0 || currentsong.muted) volumeIcon.className = "ri-volume-mute-fill";
        else if (val < 50) volumeIcon.className = "ri-volume-down-fill";
        else volumeIcon.className = "ri-volume-up-fill";
    }

    volumeSlider.addEventListener("input", e => {
        const val = e.target.value;
        currentsong.volume = val / 100;
        if (currentsong.volume > 0) currentsong.muted = false;
        updateVolumeIcon(val);
    });

    volumeBtn.addEventListener("click", () => {
        if (currentsong.volume > 0 && !currentsong.muted) {
            previousVolume = currentsong.volume;
            currentsong.muted = true;
            volumeSlider.value = 0;
        } else {
            currentsong.muted = false;
            currentsong.volume = previousVolume > 0 ? previousVolume : 1;
            volumeSlider.value = currentsong.volume * 100;
        }
        updateVolumeIcon(volumeSlider.value);
    });
}

// Start App
main();