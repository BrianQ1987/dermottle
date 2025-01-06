let score_value = 0;
let playing = true;

let answer_screen = document.getElementById("answer-screen");
let guess_panel = document.getElementById("guess-panel");

async function renderGame() {

    let picks;
    let movies;
    let actors;

    try {
        const response = await fetch("picks.json");
        const responseData = await response.json();
        picks = responseData;
    } catch (error) {
        
    }

    try {
        const response = await fetch("movies.json");
        const responseData = await response.json();
        movies = responseData;
    } catch (error) {
        
    }

    try {
        const response = await fetch("actors.json");
        const responseData = await response.json();
        actors = responseData;
    } catch (error) {
        
    }

    let today = new Date;
    today = today.toISOString().split('T')[0];

    let movie = movies[picks[today]];

    if (localStorage.hasOwnProperty("last_played")) {
        let last_played = localStorage.getItem("last_played");
        if (last_played == today) {
            playing = false;
            score_value = localStorage.getItem("last_score");
            answer_screen.style.display = "block";
            guess_panel.style.display = "none";
            document.getElementById("see-results").style.display = "block";
            document.getElementById("result").textContent = localStorage.getItem("last_answer");
            document.getElementById("correct-answer").textContent = "The correct answer is " + movie.answer;
            if (localStorage.getItem("last_answer") == "Correct") {
                if (score_value == 0) {
                    document.getElementById("final-score").innerHTML = "You got the correct answer using 0 hints";
                } else if (score_value == 1) {
                    document.getElementById("final-score").innerHTML = "You got the correct answer with 1 hint";
                } else {
                    document.getElementById("final-score").innerHTML = "You got the correct answer with " + score_value + " hints";
                }
            } else {
                document.getElementById("final-score").innerHTML = "Better luck next time!";
            }
            document.getElementById("actor-photo").innerHTML = "<img src = '" + actors[movie.answer].profile_path + "'>";
            document.getElementById("movie-poster").innerHTML = "<img src = '" + movie.poster_path + "'>";
            document.getElementById("imdb-link").innerHTML = "Check out <a href = 'https://imdb.com/title/" + movie.imdb + "' target = '_blank'>" + movie.title + "</a> on IMDb"
        }
    }   

    document.getElementById("movie-title").innerHTML = "<i>" + movie.title + "</i>";

    let hints = document.getElementsByClassName("hint");

    for (let i = 0; i < hints.length; i ++) {

        hints[i].onclick = function () {

            if (!hints[i].classList.contains("revealed") && playing) {
                score_value += 1;
                document.getElementById("score").textContent = score_value;
            }

            hints[i].textContent = movie[hints[i].id];
            hints[i].classList.add("revealed");

            if (hints[i].id == "overview") {
                hints[i].style.fontWeight = "normal";
                hints[i].style.fontStyle = "italic";
            }

        }
    }

    let buttons = document.getElementsByClassName("guess-button");

    for (let i = 0; i < buttons.length; i ++) {
        buttons[i].onclick = function () {

            if (playing) {
                playing = false;
                answer_screen.style.display = "block";
                document.getElementById("guess-panel").style.display = "none";
                document.getElementById("see-results").style.display = "block";

                if ((buttons[i].id == "dermot-button" &&  movie.answer == "Dermot Mulroney") || (buttons[i].id == "dylan-button" &&  movie.answer == "Dylan McDermott")) {
                    document.getElementById("result").textContent = "Correct";
                    document.getElementById("correct-answer").innerHTML = movie.answer + " starred in <em>" + movie.title + "</em>";
                    if (score_value == 0) {
                        document.getElementById("final-score").innerHTML = "You got the correct answer using 0 hints";
                    } else if (score_value == 1) {
                        document.getElementById("final-score").innerHTML = "You got the correct answer with 1 hint";
                    } else {
                        document.getElementById("final-score").innerHTML = "You got the correct answer with " + score_value + " hints";
                    }

                    localStorage.setItem("last_answer", "Correct")
                    localStorage.setItem("last_score", score_value)

                } else {
                    document.getElementById("result").textContent = "Incorrect";
                    document.getElementById("correct-answer").textContent = "The correct answer is " + movie.answer;
                    document.getElementById("final-score").innerHTML = "Better luck next time!";

                    localStorage.setItem("last_answer", "Incorrect")
                    localStorage.setItem("last_score", "Incorrect")
                }

                document.getElementById("actor-photo").innerHTML = "<img src = '" + actors[movie.answer].profile_path + "'>";
                document.getElementById("movie-poster").innerHTML = "<img src = '" + movie.poster_path + "'>";
                document.getElementById("imdb-link").innerHTML = "Check out <a href = 'https://imdb.com/title/" + movie.imdb + "' target = '_blank'>" + movie.title + "</a> on IMDb"

                localStorage.setItem("last_played", today);
                

            }
        }
    }

    document.getElementById("close-button").onclick = function() {
        answer_screen.style.display = "none";
    }

    document.getElementById("see-results").onclick = function() {
        answer_screen.style.display = "block";
    }

    setInterval(function() {
        let now  = new Date().getTime();

        let hours = 23 - Math.floor((now % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        let minutes = 59 - Math.floor((now % (1000 * 60 * 60)) / (1000 * 60));
        let seconds = 59 - Math.floor((now % (1000 * 60)) / 1000);

        if (seconds < 10) {
            seconds = "0" + seconds
        }

        if (minutes < 10) {
            minutes = "0" + minutes
        }

        if (hours < 10) {
            hours = "0" + hours
        }

        let time_remaining = hours + ":" + minutes + ":" + seconds;

        document.getElementById("countdown").textContent = time_remaining;

    }, 1000);

}

window.onload = renderGame;