async function renderGame() {

    let playing = true;

    let answer_screen = document.getElementById("answer-screen");
    let guess_panel = document.getElementById("guess-panel");
    let final_score = document.getElementById("final-score");
    let that_is = document.getElementById("that-is");

    let items = ["0 (Perfect)", "+1", "+2", "+3", "+4", "+5", "+6", "Incorrect", "streak", "max_streak", "games_played", "score_today"];

    for (let i = 0; i < items.length; i ++) {
        if (!localStorage.hasOwnProperty(items[i])) {
            localStorage.setItem(items[i], "0")
        }
    }

    let score_value = Number(localStorage.getItem("score_today"));
    document.getElementById("score").textContent = score_value;    

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

    let today = new Date();
    let yesterday = new Date(today);

    yesterday.setDate(yesterday.getDate() - 1);
    yesterday = yesterday.toISOString().split('T')[0];

    today = today.toISOString().split('T')[0];

    if (!Object.keys(picks).includes(today)) {
        location.reload();
    }

    let text_months = {
        "01": "January",
        "02": "February",
        "03": "March",
        "04": "April",
        "05": "May",
        "06": "June",
        "07": "July",
        "08": "August",
        "09": "September",
        "10": "October",
        "11": "November",
        "12": "December",
    }

    function show_answer (movie, actors) {
        document.getElementById("correct-answer").innerHTML = "<b>" + movie.answer + "</b> starred in <em>" + movie.title + "</em>";
        document.getElementById("actor-photo").innerHTML = "<img src = '" + actors[movie.answer].profile_path + "'>";
        document.getElementById("movie-poster").innerHTML = "<img src = '" + movie.poster_path + "'>";
        document.getElementById("imdb-link").innerHTML = "Check out <a href = 'https://imdb.com/title/" + movie.imdb + "' target = '_blank'>" + movie.title + "</a> on IMDb";
    }

    function draw_graph (games_played) {

        let bars = {
            "bar-0": {"item": "0 (Perfect)"},
            "bar-1": {"item": "+1"},
            "bar-2": {"item": "+2"},
            "bar-3": {"item": "+3"},
            "bar-4": {"item": "+4"},
            "bar-5": {"item": "+5"},
            "bar-6": {"item": "+6"},
            "bar-incorrect": {"item": "Incorrect"}
        }

        let values = [];
        for (let i = 0; i < Object.keys(bars).length; i ++) {
            bars[Object.keys(bars)[i]].value = Number(localStorage.getItem(bars[Object.keys(bars)[i]].item));
            values.push(bars[Object.keys(bars)[i]].value)
        }
        let max_value = Math.max(...values);

        let chart_div = document.getElementById("chart");

        while (chart_div.firstChild) {
            chart_div.removeChild(chart_div.firstChild)
        }

        chart_div.innerHTML = '<div id = "axis-label">Hints used</div>';
        
        for (let i = 0; i < Object.keys(bars).length; i ++) {
            let graph_row = document.createElement("div");
            graph_row.classList.add("row");
            let graph_label = document.createElement("div");
            graph_label.classList.add("axis");
            graph_label.textContent = bars[Object.keys(bars)[i]].item;
            graph_row.appendChild(graph_label);
            let graph_bar = document.createElement("div");
            graph_bar.id = Object.keys(bars)[i];
            graph_bar.classList.add("bar");

            if (games_played == 0) {
                graph_bar.style.width = "0px";
                graph_bar.textContent = "0%";
                chart_div.style.width = "280px";
            } else {
                graph_bar.style.width = (bars[Object.keys(bars)[i]].value / max_value * 200) + "px";
                graph_bar.textContent = Math.round(bars[Object.keys(bars)[i]].value / games_played * 100) + "%";
                chart_div.removeAttribute("style");
            }            

            if (bars[Object.keys(bars)[i]].value == 0) {
                graph_bar.style.justifyContent = "left";
                graph_bar.style.color = "#fff";
            }
            graph_row.appendChild(graph_bar);
            chart_div.appendChild(graph_row);
        }


        let win_rate = 0;
        if (games_played > 0) {
            win_rate = Math.round((games_played - Number(localStorage.getItem("Incorrect"))) / games_played * 100);
        }

        document.getElementById("games-played").textContent = games_played;
        document.getElementById("win-rate").textContent = win_rate + "%";
        document.getElementById("streak").textContent = localStorage.getItem("streak");
        document.getElementById("max-streak").textContent = localStorage.getItem("max_streak");
    }

    document.getElementById("date").textContent = text_months[today.slice(5, 7)] + " " + Number(today.slice(8, 10)) + ", " + today.slice(0, 4);

    let movie = movies[picks[today]];
    let on_streak = false;

    let hints = document.getElementsByClassName("hint");

    for (let i = 0; i < hints.length; i ++) {
        if (!localStorage.hasOwnProperty(hints[i].id)) {
            localStorage.setItem(hints[i].id, false)
        }
        if (score_value == 0) {
            localStorage.setItem(hints[i].id, false)
        }
        if (localStorage.getItem(hints[i].id) == "true") {
            hints[i].textContent = movie[hints[i].id];
            hints[i].classList.add("revealed");

            if (hints[i].id == "overview") {
                hints[i].style.fontWeight = "normal";
                hints[i].style.fontStyle = "italic";
            }
        }
    }   

    if (localStorage.hasOwnProperty("last_played")) {
        let last_played = localStorage.getItem("last_played");
        if (last_played == today) {
            playing = false;
            score_value = localStorage.getItem("last_score");
            answer_screen.style.display = "flex";
            guess_panel.style.display = "none";
            document.getElementById("score-container").innerHTML = "<b>Your score:</b> " + score_value;
            document.getElementById("see-results").style.display = "block";
            document.getElementById("result").textContent = localStorage.getItem("last_answer");
            
            if (localStorage.getItem("last_answer") == "Correct") {
                if (score_value == 0) {
                    final_score.innerHTML = "You got the correct answer using 0 hints";
                } else if (score_value == 1) {
                    final_score.innerHTML = "You got the correct answer with 1 hint";
                } else {
                    final_score.innerHTML = "You got the correct answer with " + score_value + " hints";
                }
            } else {
                final_score.innerHTML = "Better luck next time!";
            }

            show_answer(movie, actors);

            let games_played = Number(localStorage.getItem("games_played"));

            draw_graph(games_played);
            
            for (let i = 0; i < hints.length; i ++) {

                hints[i].textContent = movie[hints[i].id];
                hints[i].classList.add("revealed");
    
                if (hints[i].id == "overview") {
                    hints[i].style.fontWeight = "normal";
                    hints[i].style.fontStyle = "italic";
                }
            }               
            
            on_streak = true;
        } else if (last_played == yesterday) {
            on_streak = true;
        }
    }
    
    document.getElementById("movie-title").innerHTML = "<i>" + movie.title + "</i>";

    for (let i = 0; i < hints.length; i ++) {

        hints[i].onclick = function () {

            if (!hints[i].classList.contains("revealed") && playing) {
                score_value += 1;
                document.getElementById("score").textContent = score_value;
                localStorage.setItem("score_today", score_value);
                localStorage.setItem(hints[i].id, true);
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
                that_is.style.display = "block";
                share_btn.style.display = "block";
                document.getElementById("next").style.display = "block";
                document.getElementById("countdown").style.display = "block";
                answer_screen.style.display = "flex";
                document.getElementById("guess-panel").style.display = "none";
                document.getElementById("see-results").style.display = "block";

                let streak = Number(localStorage.getItem("streak"));
                let max_streak = Number(localStorage.getItem("max_streak"));
                let games_played = Number(localStorage.getItem("games_played")) + 1;

                localStorage.setItem("games_played", games_played);

                if ((buttons[i].id == "dermot-button" &&  movie.answer == "Dermot Mulroney") || (buttons[i].id == "dylan-button" &&  movie.answer == "Dylan McDermott")) {
                    document.getElementById("result").textContent = "Correct";
                    
                    if (score_value == 0) {
                        final_score.innerHTML = "You got the correct answer using 0 hints";
                        let score_count = Number(localStorage.getItem("0 (Perfect)"));
                        localStorage.setItem("0 (Perfect)", score_count + 1);
                    } else if (score_value == 1) {
                        final_score.innerHTML = "You got the correct answer with 1 hint";
                        let score_count = Number(localStorage.getItem("+1"));
                        localStorage.setItem("+1", score_count + 1);
                    } else {
                        final_score.innerHTML = "You got the correct answer with " + score_value + " hints";
                        let score_count = Number(localStorage.getItem("+" + score_value));
                        localStorage.setItem("+" + score_value, score_count + 1);
                    }

                    localStorage.setItem("last_answer", "Correct");
                    localStorage.setItem("last_score", score_value);

                    if (on_streak) {
                        streak += 1;
                    } else {
                        streak = 1;
                    }

                    localStorage.setItem("streak", streak);

                    if (streak > max_streak) {
                        max_streak = streak;
                        localStorage.setItem("max_streak", max_streak);
                    }

                    
                    
                } else {
                    document.getElementById("result").textContent = "Incorrect";
                    final_score.innerHTML = "Better luck next time!";

                    localStorage.setItem("last_answer", "Incorrect")
                    localStorage.setItem("last_score", "Incorrect")

                    let score_count = Number(localStorage.getItem("Incorrect"));
                    localStorage.setItem("Incorrect", score_count + 1);

                    localStorage.setItem("streak", 0)
                }

                show_answer(movie, actors)
                
                localStorage.setItem("last_played", today);

                draw_graph(games_played);

                localStorage.setItem("score_today", 0);

                move_created();

            }
        }
    }

    document.getElementById("close-button").onclick = function() {
        answer_screen.style.display = "none";
    }

    document.getElementById("see-results").onclick = function() {
        answer_screen.style.display = "flex";
    }

    document.getElementById("help").onclick = function() {
        document.getElementById("help-screen").style.display = "flex";
    }

    document.getElementById("close-help-btn").onclick = function() {
        document.getElementById("help-screen").style.display = "none";
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

        document.getElementById("countdown").textContent =  hours + ":" + minutes + ":" + seconds;

    }, 1000);

    share_btn = document.getElementById("share");
    
    share_btn.onclick = function () {

        let message;
        let last_score = localStorage.getItem("last_score");
        
        if (last_score == "Incorrect") {
            message = "I was not able to tell Dylan McDermott from Dermot Mulroney today. See if you can do better!"
        } else if (last_score == "0") {
            message = "Today I knew my Dylan McDermott from my Dermot Mulroney without using a single hint. But tomorrow I might not be so lucky."
        } else {
            message = "Today I knew my Dylan McDermott from my Dermot Mulroney. But tomorrow I might not be so lucky. It only took me " + last_score + " hints! See if you can do better!"
        }

        if (navigator.share) {
            navigator.share({
              title: 'Dermottle | The Daily Guessing Game with one Simple Question',
              url: document.location.href,
              text: message
            }).catch(console.error);
          } else {
            // fallback
          }
    }

    document.getElementById("stats-button").onclick = function () {

        let games_played = localStorage.getItem("games_played");

        if (playing) {
            draw_graph(games_played);
            that_is.style.display = "none";
            share_btn.style.display = "none";
            document.getElementById("next").style.display = "none";
            document.getElementById("countdown").style.display = "none";
        } else {
            that_is.style.display = "block";
        }

        document.getElementById("see-results").click();
    }

    document.getElementById("info-button").onclick = function() {
        document.getElementById("tmdb").style.display = "flex";
    }

    document.getElementById("close-info-btn").onclick = function() {
        document.getElementById("tmdb").style.display = "none";
    }

    function move_created () {

        let calculated_space = window.innerHeight - document.getElementById("container").clientHeight - document.getElementById("created").clientHeight - 10;

        if (calculated_space < 20) {
            document.getElementById("created").style.marginTop = "20px";
            document.getElementById("created").style.marginBottom = "10px";
        } else {
            document.getElementById("created").style.marginTop = calculated_space + "px";
        }

    }

    move_created();    

}

window.onload = renderGame;