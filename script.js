alert(
  "Select a folder that contains your music 🎵\n\n" +
  "• This site only plays your audio files\n" +
  "• Your music is NOT uploaded or stored\n" +
  "• Reloading the page will remove the selected files\n\n" +
  "Enjoy your music!"
);

let currentsong = new Audio();
let songs;
let currfolder;
let currentIndex = 0;
let userFolders = [];
let currentObjectUrl = null;

function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00"
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const paddedMins = mins.toString().padStart(2, '0');
    const paddedSecs = secs.toString().padStart(2, '0');
    return `${paddedMins}:${paddedSecs}`;
}

function cleanSongName(filename) {
    return decodeURI(filename)
        .replace(/\.[^/.]+$/, "")
        .replace(/[_\-]+/g, " ")
        // .replace(/\(.*?\)/g, "")
        // .replace(/\b\d+\b/g, "")
        // .replace(/\s+/g, " ")
        .trim();
}

function cleanFolderName(folderPath) {
    const folder = folderPath.split("/").pop();
    return decodeURI(folder)
        .replace(/[_\-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function isAudioFile(file) {
    return file.type.startsWith("audio/") ||
        /\.(mp3|wav|ogg|m4a|flac|aac)$/i.test(file.name);
}

function supportsFolderPicker() {
    return "showDirectoryPicker" in window;
}

async function getSongs(folder) {
    currfolder = folder;
    const folderTitle = document.querySelector(".foldername h3");
    if (folderTitle) {
        folderTitle.textContent = cleanFolderName(folder);
    }

    // sort songs alphanumerically
    songs.sort((a, b) =>
        cleanSongName(a.name).localeCompare(
            cleanSongName(b.name),
            undefined,
            { numeric: true, sensitivity: "base" }
        )
    );

    //show all the songs in the library
    let songUL = document.querySelector(".songlist ul");
    songUL.innerHTML = "";

    songs.forEach((file, index) => {
        songUL.innerHTML += `
            <li data-index="${index}">
                <img class="invert" src="images/music.svg" alt="music">
                <div class="info">${cleanSongName(file.name)}</div>
                <img class="invert" src="images/play.svg" alt="play">
            </li>`;
    });

    Array.from(songUL.children).forEach(li => {
        li.addEventListener("click", () => {
            playmusic(songs[li.dataset.index]);
        });
    });

    return songs
}

function loadSongSource(file) {
    if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl);
    }

    currentObjectUrl = URL.createObjectURL(file);
    currentsong.src = currentObjectUrl;
}

//music player
const playmusic = (file, pause = false) => {
    currentIndex = songs.indexOf(file);
    loadSongSource(file);

    if (!pause) {
        currentsong.play();
        playing.src = "images/pause.svg";
    }

    document.querySelector(".songinfo").innerHTML = cleanSongName(file.name);
    document.querySelector(".currenttime").innerHTML = "00:00";
    document.querySelector(".songduration").innerHTML = "00:00";
};


//show all playlist folders
async function displayAlbums() {
    const cardContainer = document.querySelector(".cardContainer");
    cardContainer.innerHTML = "";

    userFolders.forEach(folder => {
        cardContainer.innerHTML += `
            <div data-folder="${folder.name}" class="card bg-grey">
                <div class="foldersvg">
                    <img src="images/folder.svg" alt="folder">
                </div>
                <div class="play">
                    <img src="images/playlist_play.svg" alt="playlist_play">
                </div>
                <div class="cardname">
                    <h2>${cleanFolderName(folder.name)}</h2>
                </div>         
            </div>`;
    });

    // load the folder whenever the card is clicked
    Array.from(document.getElementsByClassName("card")).forEach(card => {
        card.addEventListener("click", async (e) => {
            const folderName = e.currentTarget.dataset.folder;
            songs = userFolders.find(f => f.name === folderName).songs;
            await getSongs(folderName);
            playmusic(songs[0]);
        });
    });
}

async function main() {

    document.getElementById("pickFolder").addEventListener("click", async () => {
        if (supportsFolderPicker() && window.showDirectoryPicker) {
            try {
                const directoryHandle = await window.showDirectoryPicker();
                const collectedFiles = [];

                async function walkDirectory(handle, path = "") {
                    for await (const entry of handle.values()) {
                        if (entry.kind === "file") {
                            const file = await entry.getFile();
                            if (isAudioFile(file)) {
                                collectedFiles.push({ file, path: `${path}${file.name}` });
                            }
                        } else if (entry.kind === "directory") {
                            await walkDirectory(entry, `${path}${entry.name}/`);
                        }
                    }
                }

                await walkDirectory(directoryHandle);

                if (collectedFiles.length === 0) {
                    alert("No audio files found in the selected folder.");
                    return;
                }

                const folderMap = {};
                collectedFiles.forEach(({ file, path }) => {
                    const parts = path.split("/");
                    const folderName = parts.length > 1 ? parts[0] : "Selected Music";

                    if (!folderMap[folderName]) {
                        folderMap[folderName] = [];
                    }
                    folderMap[folderName].push(file);
                });

                userFolders = Object.keys(folderMap)
                    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }))
                    .map(folder => ({
                        name: folder,
                        songs: folderMap[folder]
                    }));

                songs = userFolders[0].songs;
                await getSongs(userFolders[0].name);
                await displayAlbums();
                playmusic(songs[0], true);
            } catch (error) {
                if (error && error.name !== "AbortError") {
                    console.error(error);
                }
            }
            return;
        }

        document.getElementById("fileInput").click();
    });

    document.getElementById("fileInput").addEventListener("change", (e) => {
        const files = Array.from(e.target.files);

        userFolders = [];
        const folderMap = {};

        files.forEach(file => {
            // ignore non-audio files
            if (!isAudioFile(file)) return;

            const parts = file.webkitRelativePath.split("/");
            const folderName = parts.length > 2 ? parts[1] : parts[0];

            if (!folderMap[folderName]) {
                folderMap[folderName] = [];
            }
            folderMap[folderName].push(file);
        });

        // keep ONLY folders that actually have audio files
        userFolders = Object.keys(folderMap)
            .filter(folder => folderMap[folder].length > 0)
            .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }))
            .map(folder => ({
                name: folder,
                songs: folderMap[folder]
            }));

        // stop if nothing valid was found
        if (userFolders.length === 0) {
            alert("No audio files found in the selected folder.");
            return;
        }

        // load first valid folder
        songs = userFolders[0].songs;
        getSongs(userFolders[0].name);
        displayAlbums();
        playmusic(songs[0], true);
    });



    //Attach an event listener to play
    playing.addEventListener("click", () => {
        if (currentsong.paused) {
            currentsong.play();
            playing.src = "images/pause.svg";
        }
        else {
            currentsong.pause();
            playing.src = "images/play.svg";
        }
    });

    // eventlistenr for time update
    currentsong.addEventListener("timeupdate", () => {
        const duration = Number.isFinite(currentsong.duration) && currentsong.duration > 0 ? currentsong.duration : 0;
        const progress = duration > 0 ? (currentsong.currentTime / duration) * 100 : 0;

        document.querySelector(".currenttime").innerHTML = `${formatTime(currentsong.currentTime)}`
        document.querySelector(".songduration").innerHTML = `${formatTime(duration)}`
        if (progress < 99.8) {
            document.querySelector(".circle").style.left = progress + "%"
        }
        document.querySelector(".trail").style.width = progress + "%"
    })

    // event listner to seekbar
    const seekbar = document.querySelector(".seekbar");

    seekbar.addEventListener("click", (e) => {
        if (!Number.isFinite(currentsong.duration) || currentsong.duration <= 0) {
            return;
        }

        const rect = seekbar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percent = (clickX / rect.width) * 100;

        document.querySelector(".circle").style.left = percent + "%";
        document.querySelector(".trail").style.width = percent + "%";
        currentsong.currentTime = (currentsong.duration * percent) / 100;
    });

    const circle = document.querySelector(".circle");

    let isDragging = false;
    function updateSeek(clientX) {
        if (!Number.isFinite(currentsong.duration) || currentsong.duration <= 0) {
            return;
        }

        const rect = seekbar.getBoundingClientRect();
        let percent = ((clientX - rect.left) / rect.width) * 100;
        percent = Math.max(0, Math.min(100, percent));

        document.querySelector(".circle").style.left = percent + "%";
        document.querySelector(".trail").style.width = percent + "%";
        currentsong.currentTime = (currentsong.duration * percent) / 100;
    }

    // Mouse events
    circle.addEventListener("mousedown", (e) => {
        isDragging = true;
        currentsong.pause();
        e.preventDefault();
    });

    document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        updateSeek(e.clientX);
    });

    document.addEventListener("mouseup", () => {
        if (isDragging) {
            isDragging = false;
            currentsong.play();
        }
    });

    // Touch events 
    circle.addEventListener("touchstart", (e) => {
        isDragging = true;
        currentsong.pause();
    });

    document.addEventListener("touchmove", (e) => {
        if (!isDragging) return;
        updateSeek(e.touches[0].clientX);
    });

    document.addEventListener("touchend", () => {
        if (isDragging) {
            isDragging = false;
            currentsong.play();
        }
    });


    //event listner to prev and next
    prev.addEventListener("click", () => {
        if (currentIndex > 0) {
            playmusic(songs[currentIndex - 1]);
        }
    });

    next.addEventListener("click", () => {
        if (currentIndex + 1 < songs.length) {
            playmusic(songs[currentIndex + 1]);
        }
    });

    currentsong.addEventListener("ended", () => {
        if (currentIndex + 1 < songs.length) {
            playmusic(songs[currentIndex + 1]);
        } else {
            playing.src = "images/play.svg";
        }
    });

    // event listner to volume
    document.querySelector(".volume").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        currentsong.volume = parseInt(e.target.value) / 100

        if (document.querySelector(".volume").getElementsByTagName("img")[0].src.includes("images/mute.svg")) {
            document.querySelector(".volume").getElementsByTagName("img")[0].src = document.querySelector(".volume").getElementsByTagName("img")[0].src.replace("images/mute.svg", "images/volume.svg")
        }
        if (currentsong.volume == 0) {
            document.querySelector(".volume").getElementsByTagName("img")[0].src = document.querySelector(".volume").getElementsByTagName("img")[0].src.replace("images/volume.svg", "images/mute.svg")
        }
    })

    // event listner to mute the track
    let prev_value
    document.querySelector(".volume>img").addEventListener("click", e => {
        if (e.target.src.includes("images/volume.svg")) {
            e.target.src = e.target.src.replace("images/volume.svg", "images/mute.svg")
            currentsong.volume = 0
            prev_value = document.querySelector(".volume").getElementsByTagName("input")[0].value
            document.querySelector(".volume").getElementsByTagName("input")[0].value = 0

        }
        else {
            e.target.src = e.target.src.replace("images/mute.svg", "images/volume.svg")
            currentsong.volume = parseInt(prev_value) / 100
            document.querySelector(".volume").getElementsByTagName("input")[0].value = prev_value

        }
    })
}

main()