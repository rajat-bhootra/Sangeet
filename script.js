console.log('lets do JS');
let currentsong = new Audio();

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const paddedMins = mins.toString().padStart(2, '0');
    const paddedSecs = secs.toString().padStart(2, '0');
    return `${paddedMins}:${paddedSecs}`;
}

async function getSongs() {
    let a = await fetch("http://10.32.6.12:3000/songs/")
    let response = await a.text();
    let div = document.createElement("div")
    div.innerHTML = response;
    let as = div.getElementsByTagName("a")
    let songs = []
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split("/songs/")[1])
        }

    }
    return songs
}

const playmusic = (track, pause = false) => {
    currentsong.src = "/songs/" + track
    if (!pause) {
        currentsong.play();
        playing.src = "pause.svg"
    }
    document.querySelector(".songinfo").innerHTML = decodeURI(track)
    document.querySelector(".songtime").innerHTML = `00:00/00:00`
}

async function main() {


    // get the list of all songs
    let songs = await getSongs()
    playmusic(songs[0], true)

    //show all the songs in playlist
    let songUL = document.querySelector(".songlist").getElementsByTagName("ul")[0]
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
}

main()