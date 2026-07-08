// ==========================================================
// SANGEET 2.0
// PART 3A
// ==========================================================

alert(
    `🎵 Welcome to Sangeet

• Your music never leaves your computer.
• Nothing is uploaded.
• Select a folder and enjoy.

Happy Listening ❤️`
);

let currentsong = new Audio();

let songs = [];
let userFolders = [];
let currentFolder = "";

let currentIndex = 0;
let currentObjectUrl = null;

let isDragging = false;

const playBtn = document.getElementById("playing");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");

const songList = document.querySelector(".songlist");
const folderTitle = document.querySelector(".foldername span");
const cardContainer = document.querySelector(".cardContainer");

const songInfo = document.querySelector(".songinfo");

const currentTime = document.querySelector(".currenttime");
const duration = document.querySelector(".songduration");

const seekbar = document.querySelector(".seekbar");
const trail = document.querySelector(".trail");
const circle = document.querySelector(".circle");

const loader =
    document.getElementById("loader");

// ==========================================================
// TOAST
// ==========================================================

function showToast(message) {

    const toast = document.getElementById("toast");

    toast.querySelector("p").textContent = message;

    toast.classList.add("show");

    clearTimeout(showToast.timeout);

    showToast.timeout = setTimeout(() => {

        toast.classList.remove("show");

    }, 2800);

}

function closeMenu() {

    sidebar.classList.remove("open");

    overlay.classList.remove("show");

}

// ==========================================================
// HELPERS
// ==========================================================

function formatTime(seconds) {

    if (isNaN(seconds) || seconds < 0) {

        return "00:00";

    }

    const mins = Math.floor(seconds / 60);

    const secs = Math.floor(seconds % 60);

    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

}

function cleanSongName(name) {

    return decodeURI(name)

        .replace(/\.[^/.]+$/, "")

        .replace(/[_\-]+/g, " ")

        .replace(/\s+/g, " ")

        .trim();

}

function cleanFolderName(folder) {

    return decodeURI(folder)

        .replace(/[_\-]+/g, " ")

        .replace(/\s+/g, " ")

        .trim();

}

function isAudioFile(file) {

    return file.type.startsWith("audio/")

        ||

        /\.(mp3|wav|ogg|aac|flac|m4a)$/i.test(file.name);

}

function supportsFolderPicker() {

    return "showDirectoryPicker" in window;

}

// ==========================================================
// OBJECT URL
// ==========================================================

function loadSong(file) {

    if (currentObjectUrl) {

        URL.revokeObjectURL(currentObjectUrl);

    }

    currentObjectUrl = URL.createObjectURL(file);

    currentsong.src = currentObjectUrl;

}

// ==========================================================
// PLAY
// ==========================================================

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

        playBtn.innerHTML =

            `<i class="ri-pause-fill"></i>`;

    }

}

// ==========================================================
// LIBRARY
// ==========================================================

async function getSongs(folder) {

    currentFolder = folder;

    folderTitle.textContent =

        cleanFolderName(folder);

    songs.sort((a, b) => {

        return cleanSongName(a.name)

            .localeCompare(

                cleanSongName(b.name),

                undefined,

                {

                    numeric: true,

                    sensitivity: "base"

                });

    });

    songList.innerHTML = "";

    songs.forEach((file, index) => {

        songList.innerHTML += `

<li data-index="${index}">

<div class="info">

${cleanSongName(file.name)}

</div>

</li>

`;

    });

    Array.from(songList.children).forEach(item => {

        item.addEventListener("click", () => {

            playMusic(

                songs[item.dataset.index]

            );

        });

    });

}

// ==========================================================
// PLAYLISTS
// ==========================================================

function randomGradient() {

    const gradients = [

        "linear-gradient(135deg,#8B5CF6,#06B6D4)",

        "linear-gradient(135deg,#ff6b6b,#ff9f43)",

        "linear-gradient(135deg,#4facfe,#00f2fe)",

        "linear-gradient(135deg,#43e97b,#38f9d7)",

        "linear-gradient(135deg,#fa709a,#fee140)",

        "linear-gradient(135deg,#30cfd0,#330867)"

    ];

    return gradients[Math.floor(Math.random() * gradients.length)];

}

async function displayAlbums() {

    cardContainer.innerHTML = "";
    userFolders.forEach(folder => {
        cardContainer.innerHTML += `

<div
class="card"
data-folder="${folder.name}">

<div
class="foldersvg"
style="background:${randomGradient()}">
</div>

<div class="cardname">

<h2>

${cleanFolderName(folder.name)}

</h2>

<p>

${folder.songs.length} Songs

</p>

</div>

<div class="play"></div>

</div>

`;

    });

    document

        .querySelectorAll(".card")

        .forEach(card => {

            card.onclick = async () => {

                const folder =

                    card.dataset.folder;

                songs = userFolders.find(

                    f => f.name === folder

                ).songs;

                await getSongs(folder);

                playMusic(songs[0]);

                showToast(

                    `${cleanFolderName(folder)} loaded`

                );

            };

        });

}
// ==========================================================
// SANGEET 2.0
// PART 3B
// ==========================================================

// ==========================================================
// MAIN
// ==========================================================

async function main() {

    // Loader
    loader.style.display = "flex";

    setTimeout(() => {
        loader.style.display = "none";
    }, 1200);

    // ======================================================
    // Upload Folder
    // ======================================================

    document
        .getElementById("pickFolder")
        .addEventListener("click", async () => {

            // -------------------------
            // Modern Folder Picker
            // -------------------------

            if (supportsFolderPicker() && window.showDirectoryPicker) {

                try {

                    const directory =
                        await window.showDirectoryPicker();

                    const collectedFiles = [];

                    async function walk(handle, path = "") {

                        for await (const entry of handle.values()) {

                            if (entry.kind === "file") {

                                const file = await entry.getFile();

                                if (isAudioFile(file)) {

                                    collectedFiles.push({
                                        file,
                                        path: `${path}${file.name}`
                                    });

                                }

                            } else {

                                await walk(
                                    entry,
                                    `${path}${entry.name}/`
                                );

                            }

                        }

                    }

                    await walk(directory);

                    if (collectedFiles.length === 0) {

                        showToast("No audio files found.");

                        return;

                    }

                    const folderMap = {};

                    collectedFiles.forEach(({ file, path }) => {

                        const folder =
                            path.split("/")[0] || "Music";

                        if (!folderMap[folder]) {

                            folderMap[folder] = [];

                        }

                        folderMap[folder].push(file);

                    });

                    userFolders = Object.keys(folderMap)
                        .sort((a, b) =>
                            a.localeCompare(
                                b,
                                undefined,
                                {
                                    numeric: true,
                                    sensitivity: "base"
                                }
                            )
                        )
                        .map(folder => ({
                            name: folder,
                            songs: folderMap[folder]
                        }));

                    songs = userFolders[0].songs;

                    await getSongs(userFolders[0].name);

                    displayAlbums();

                    playMusic(songs[0], true);

                    showToast(
                        `${songs.length} songs loaded`
                    );

                } catch (err) {

                    if (err.name !== "AbortError") {

                        console.error(err);

                    }

                }

                return;

            }

            // -------------------------
            // Fallback Picker
            // -------------------------

            document
                .getElementById("fileInput")
                .click();

        });

    // ======================================================
    // Input Folder
    // ======================================================

    document
        .getElementById("fileInput")
        .addEventListener("change", e => {

            const files =
                Array.from(e.target.files);

            const folderMap = {};

            files.forEach(file => {

                if (!isAudioFile(file)) return;

                const parts =
                    file.webkitRelativePath.split("/");

                const folder =
                    parts.length > 2
                        ? parts[1]
                        : parts[0];

                if (!folderMap[folder]) {

                    folderMap[folder] = [];

                }

                folderMap[folder].push(file);

            });

            userFolders =
                Object.keys(folderMap)

                    .filter(
                        folder =>
                            folderMap[folder].length
                    )

                    .sort((a, b) =>
                        a.localeCompare(
                            b,
                            undefined,
                            {
                                numeric: true,
                                sensitivity: "base"
                            }
                        )
                    )

                    .map(folder => ({
                        name: folder,
                        songs: folderMap[folder]
                    }));

            if (!userFolders.length) {

                showToast(
                    "No valid audio files found."
                );

                return;

            }

            songs = userFolders[0].songs;

            getSongs(userFolders[0].name);

            displayAlbums();

            playMusic(songs[0], true);

            showToast(
                `${songs.length} songs loaded`
            );

        });

    // ======================================================
    // Play Pause
    // ======================================================

    playBtn.addEventListener("click", () => {

        if (!currentsong.src) return;

        if (currentsong.paused) {

            currentsong.play();

            playBtn.innerHTML =
                `<i class="ri-pause-fill"></i>`;

        } else {

            currentsong.pause();

            playBtn.innerHTML =
                `<i class="ri-play-fill"></i>`;

        }

    });

    // ======================================================
    // Previous
    // ======================================================

    prevBtn.addEventListener("click", () => {

        if (currentIndex > 0) {

            playMusic(
                songs[currentIndex - 1]
            );

        }

    });

    // ======================================================
    // Next
    // ======================================================

    nextBtn.addEventListener("click", () => {

        if (currentIndex + 1 < songs.length) {

            playMusic(
                songs[currentIndex + 1]
            );

        }

    });

    // ======================================================
    // Auto Next
    // ======================================================

    currentsong.addEventListener("ended", () => {

        if (currentIndex + 1 < songs.length) {

            playMusic(
                songs[currentIndex + 1]
            );

        } else {

            playBtn.innerHTML =
                `<i class="ri-play-fill"></i>`;

        }

    });

    // ======================================================
    // Time Update
    // ======================================================

    currentsong.addEventListener(
        "timeupdate",
        () => {

            const total =
                Number.isFinite(currentsong.duration)
                    ? currentsong.duration
                    : 0;

            const progress =
                total > 0
                    ? (currentsong.currentTime /
                        total) *
                    100
                    : 0;

            currentTime.textContent =
                formatTime(
                    currentsong.currentTime
                );

            duration.textContent =
                formatTime(total);

            trail.style.width =
                progress + "%";

            circle.style.left =
                progress + "%";

        }
    );

    // ======================================================
    // Seek
    // ======================================================

    function seek(clientX) {

        if (
            !Number.isFinite(
                currentsong.duration
            )
        )
            return;

        const rect =
            seekbar.getBoundingClientRect();

        let percent =
            ((clientX - rect.left) /
                rect.width) *
            100;

        percent = Math.max(
            0,
            Math.min(100, percent)
        );

        trail.style.width =
            percent + "%";

        circle.style.left =
            percent + "%";

        currentsong.currentTime =
            (currentsong.duration * percent) /
            100;

    }

    seekbar.onclick = e =>
        seek(e.clientX);

    circle.onmousedown = () => {

        isDragging = true;

    };

    document.onmousemove = e => {

        if (!isDragging) return;

        seek(e.clientX);

    };

    document.onmouseup = () => {

        isDragging = false;

    };

    // Touch

    circle.ontouchstart = () => {

        isDragging = true;

    };

    document.ontouchmove = e => {

        if (!isDragging) return;

        seek(e.touches[0].clientX);

    };

    document.ontouchend = () => {

        isDragging = false;

    };

    // ======================================================
    // Volume
    // ======================================================

    const volume =
        document.querySelector(".range");

    currentsong.volume = 1;

    volume.addEventListener(
        "input",
        e => {

            currentsong.volume =
                e.target.value / 100;

        }
    );

}

// ==========================================================
// START
// ==========================================================

main();