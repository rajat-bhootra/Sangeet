console.log('lets do JS');
let currentsong = new Audio();
let songs;
let currfolder;
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

async function getSongs(folder) {
    currfolder = folder;
    let a = await fetch(`/${folder}/`)
    let response = await a.text();
    let div = document.createElement("div")
    div.innerHTML = response;
    let as = div.getElementsByTagName("a")
    songs = []
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${folder}/`)[1])
        }

    }

    //show all the songs in playlist
    let songUL = document.querySelector(".songlist").getElementsByTagName("ul")[0]
    songUL.innerHTML = ""
    for (const song of songs) {
        songUL.innerHTML = songUL.innerHTML + `
                            <li> 
                            <img class="invert" src="images/music.svg" alt="music">
                            <div class="info">
                                <div>${song.replaceAll("%20", " ")}</div>
                                <div>Song Artist</div>
                            </div>
                            <img class="invert" src="images/play.svg" alt="play">
                            </li>`;
    }

    //Attach an event listener to each song
    Array.from(document.querySelector(".songlist").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", element => {
            playmusic(e.querySelector(".info").firstElementChild.innerHTML.trim());
        })
    })

    return songs
}

const playmusic = (track, pause = false) => {
    currentsong.src = `/${currfolder}/` + track
    if (!pause) {
        currentsong.play();
        playing.src = "images/pause.svg"
    }
    document.querySelector(".songinfo").innerHTML = decodeURI(track)
    document.querySelector(".songtime").innerHTML = `00:00/00:00`
}

async function displayAlbums() {
    let a = await fetch(`/songs/`)
    let response = await a.text();
    let div = document.createElement("div")
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a")
    let cardContainer = document.querySelector(".cardContainer")
    let array = Array.from(anchors)
    for (let index = 0; index < array.length; index++) {
        const e = array[index];
        if (e.href.includes("/songs")) {
            let folder = e.href.split("/").slice(-2)[0]
            let a = await fetch(`http://10.32.6.12:3000/songs/${folder}`)
            cardContainer.innerHTML = cardContainer.innerHTML + `<div data-folder="${folder}" class="card bg-grey">
                        <div class="play">
                            <svg fill="#000000" width="64px" height="64px" viewBox="-2.4 -2.4 28.80 28.80" id="play"
                                data-name="Flat Color" xmlns="http://www.w3.org/2000/svg" class="icon flat-color"
                                stroke="#000000" stroke-width="0.312">
                                <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                                <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                                <g id="SVGRepo_iconCarrier">
                                    <circle id="primary" cx="12" cy="12" r="10" style="fill: #00ff00;"></circle>
                                    <path id="secondary"
                                        d="M14.75,12.83,11.55,15A1,1,0,0,1,10,14.13V9.87A1,1,0,0,1,11.55,9l3.2,2.13A1,1,0,0,1,14.75,12.83Z"
                                        style="fill: #000000;"></path>
                                </g>
                            </svg>
                        </div>
                        <img src="images/folder.svg" alt="folder">
                        <h2>${decodeURI(folder)}</h2>
                        <p>songs for you</p>
                    </div>`
        }
    }

    // load the folder whenever the card is clicked
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`)
            playmusic(songs[0])
        })
    })
}

async function main() {
    // get the list of all songs
    await getSongs("songs/Songs")
    playmusic(songs[0], true)

    //display all the albums on the page
    await displayAlbums()


    //Attach an event listener to play, prev and next
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

    // Listen for time update
    currentsong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${formatTime(currentsong.currentTime)}/${formatTime(currentsong.duration)}`
        document.querySelector(".circle").style.left = (currentsong.currentTime / currentsong.duration) * 100 + "%"
    })

    // event listner to seekbar
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100
        document.querySelector(".circle").style.left = percent + "%"
        currentsong.currentTime = ((currentsong.duration) * percent) / 100
    })

    //event listner for hambuger
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0"
    })

    //event listner for close
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%"
    })

    //event listner to prev and next
    prev.addEventListener("click", () => {
        let index = songs.indexOf(currentsong.src.split("/").slice(-1)[0])
        if ((index - 1) >= 0) {
            playmusic(songs[index - 1])
        }

    })

    next.addEventListener("click", () => {
        let index = songs.indexOf(currentsong.src.split("/").slice(-1)[0])
        if ((index + 1) < songs.length) {
            playmusic(songs[index + 1])
        }
    })

    //event listner to volume
    document.querySelector(".volume").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        currentsong.volume = parseInt(e.target.value) / 100
        
        if(document.querySelector(".volume").getElementsByTagName("img")[0].src.includes("images/mute.svg")){
            document.querySelector(".volume").getElementsByTagName("img")[0].src = document.querySelector(".volume").getElementsByTagName("img")[0].src.replace("images/mute.svg","images/volume.svg") 
        }
        if (currentsong.volume == 0){
            document.querySelector(".volume").getElementsByTagName("img")[0].src = document.querySelector(".volume").getElementsByTagName("img")[0].src.replace("images/volume.svg","images/mute.svg")
        }
    })

    // add event listner to mute the track
    let prev_value
    document.querySelector(".volume>img").addEventListener("click",e=>{
        if (e.target.src.includes("images/volume.svg")){
            e.target.src = e.target.src.replace("images/volume.svg","images/mute.svg")
            currentsong.volume = 0
            prev_value = document.querySelector(".volume").getElementsByTagName("input")[0].value
            document.querySelector(".volume").getElementsByTagName("input")[0].value = 0
            
        }
        else{
            e.target.src = e.target.src.replace("images/mute.svg","images/volume.svg") 
            currentsong.volume = parseInt(prev_value)/100
            document.querySelector(".volume").getElementsByTagName("input")[0].value = prev_value

        }
    })
}

main()