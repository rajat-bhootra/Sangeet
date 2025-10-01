console.log('lets do JS');
let currentsong = new Audio();
let songs;
let currfolder;
function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0){
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
    let a = await fetch(`http://10.32.6.12:3000/${folder}`)
    let response = await a.text();
    let div = document.createElement("div")
    div.innerHTML = response;
    let as = div.getElementsByTagName("a")
    songs = []
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`${folder}`)[1])
        }

    }

    //show all the songs in playlist
    let songUL = document.querySelector(".songlist").getElementsByTagName("ul")[0]
    songUL.innerHTML = ""
    for (const song of songs) {
        songUL.innerHTML = songUL.innerHTML + `
                            <li> 
                            <img class="invert" src="music.svg" alt="music">
                            <div class="info">
                                <div>${song.replaceAll("%20", " ")}</div>
                                <div>Song Artist</div>
                            </div>
                            <img class="invert" src="play.svg" alt="play">
                            </li>`;
    }

    //Attach an event listener to each song
    Array.from(document.querySelector(".songlist").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", element => {
            console.log(e.querySelector(".info").firstElementChild.innerHTML);
            playmusic(e.querySelector(".info").firstElementChild.innerHTML);
        })
    })
}

const playmusic = (track, pause = false) => {
    currentsong.src = `/${currfolder}/` + track
    if (!pause) {
        currentsong.play();
        playing.src = "pause.svg"
    }
    document.querySelector(".songinfo").innerHTML = decodeURI(track)
    document.querySelector(".songtime").innerHTML = `00:00/00:00`
}

async function displayAlbums() {
    let a = await fetch(`http://10.32.6.12:3000/songs/`)
    let response = await a.text();
    let div = document.createElement("div")
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a")
    Array.from(anchors).forEach(async e=>{
        if (e.href.includes("/songs")){
            let folder = e.href.split("/").slice(-2)[0]
            let a = await fetch(`http://10.32.6.12:3000/songs/${folder}`)
        }
    })
}

async function main() {
    // get the list of all songs
    await getSongs("songs/Songs/")
    playmusic(songs[0], true)
    
    //display all the albums on the page
    displayAlbums()


    //Attach an event listener to play, prev and next
    playing.addEventListener("click", () => {
        if (currentsong.paused) {
            currentsong.play();
            playing.src = "pause.svg";
        }
        else {
            currentsong.pause();
            playing.src = "play.svg";
        }
    });

    // Listen for time update
    currentsong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${formatTime(currentsong.currentTime)}/${formatTime(currentsong.duration)}`
        document.querySelector(".circle").style.left = (currentsong.currentTime / currentsong.duration) * 100 + "%"
    })

    // event listner to seekbar
    document.querySelector(".seekbar").addEventListener("click", e =>{
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100
        document.querySelector(".circle").style.left = percent + "%"
        currentsong.currentTime = (currentsong.duration * percent) / 100
    })

    //event listner for hambuger
    document.querySelector(".hamburger").addEventListener("click", ()=>{
        document.querySelector(".left").style.left = "0"
    })
    
    //event listner for close
    document.querySelector(".close").addEventListener("click", ()=>{
        document.querySelector(".left").style.left = "-100%"
    })

    //event listner to prev and next
    prev.addEventListener("click",()=>{
        let index = songs.indexOf(currentsong.src.split("/").slice(-1) [0])
        if ((index-1) >= 0){
            playmusic(songs[index-1])
        }
        
    })

    next.addEventListener("click",()=>{
        let index = songs.indexOf(currentsong.src.split("/").slice(-1) [0]) 
        if ((index+1) <  songs.length){
            playmusic(songs[index+1])
        }
    })

    //event listner to volume
    document.querySelector(".volume").getElementsByTagName("input")[0].addEventListener("change",(e)=>{
        currentsong.volume = parseInt(e.target.value)/100 
    })

    // load the folder whenever the card is clicked
    Array.from(document.getElementsByClassName("card")).forEach(e=>{
        e.addEventListener("click",async item=>{
            songs = await getSongs(`songs/${item.currentTarget.dataset.folder}/`)
        })
    })
}

main()