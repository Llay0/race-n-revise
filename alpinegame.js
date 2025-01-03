const racer = () => {
    return {
      status: "menu", //play, customise, stats, settings, and exit
      answers: [],
      question: "",
      correctAnswer: null,
      difficulty: Dom.storage.setting || "A-Level", //alt is gsce
      timeOffset: 1500,
      questionTime: 10000,
      score: 0,
      timeOut: null,
      currentLane: 99999,
      gameMode: null,
      fastestTime: Dom.storage.fast_lap_time || {},
      fastestTimeDisplay: "N/A",
      highScoreDisplay: "N/A",
      totalQs: "N/A",
      gamePlay() {
        incrementGamesPlayed();
        countQs();
        clearTimeout(this.timeOut);
        this.status = "play";
        this.timeOut = setTimeout(() => {
          this.question = "Out of time!";
          this.score -= 2;
          storeScore(-2);
          
            // const bz = document.getElementById("bazinga");
            // bz.muted = (Dom.storage.muted === "true");
            // bz.loop = false;
            // bz.volume = 0.5; // shut up 
            // bz.play();

          setTimeout(() => {
            this.gamePlay()
          }, this.timeOffset)
        }, this.questionTime)
        if (this.difficulty == "A-Level") {
          const temp = getQuadraticQuestion(this.difficulty);
          this.answers = temp.answers;
          this.correctAnswer = temp.answers.find((a) => a.correct)
          this.question = temp.question;
        } else {
          const temp = getQuadraticQuestion(this.difficulty);
          this.answers = temp.answers;
          this.correctAnswer = temp.answers.find((a) => a.correct)
          this.question = temp.question;
        }
      },
      stats() {
        this.status="stats";
        let time = Number.parseFloat(this.fastestTime);
        let mins = Math.floor(time / 60);
        let secs = (time % 60).toFixed(3);
        this.fastestTimeDisplay = `Fastest Lap: ${mins}:${secs}`;
        if (Dom.storage.score < this.score) {
          this.highScoreDisplay = `High Score: ${this.score}`;
        } else {
          this.highScoreDisplay = `High Score: ${Dom.storage.score}`;
        }
        this.totalQs = `Total Questions Answered: ${Dom.storage.totalQs}`;

      },
      clearStorage() {
        if (confirm('Are you sure you want to clear the statistics?'))
        {
          return localStorage.clear();
        }
      },
    
      settings() {
        this.status = "settings";
      },
      changeDifficulty() {
        if (this.difficulty == "A-Level") {
          this.difficulty = "GCSE";
          Dom.storage.setting = this.difficulty;
        } else {
          this.difficulty = "A-Level";
          Dom.storage.setting = this.difficulty;
        }
      },
      
      menu() {
        clearTimeout(this.timeOut);
        this.status = "menu";
        this.score = 0;
      },
      displayAnswer(answerIndex) {
        
        if (this.answers[answerIndex].correct) {
            
          this.question = "Correct!"
          this.score += 5;
          storeScore(5);
          clearTimeout(this.timeOut);
          setTimeout(() => {
            this.gamePlay();
          }, this.timeOffset)
  
        } else {
          this.question = "Incorrect!";
          this.score -= 5;
          storeScore(-5);
          setTimeout(() => {
            this.gamePlay()
          }, this.timeOffset)
        }
      },
      exit() {
        this.status = "exit";
      },
      lapEnd(lapNumber) {
        setTimeout(() => {}, 3000)
        clearTimeout(this.timeOut);
        this.status = "exit";
      },
      lapStart(lapNumber) {
        this.gamePlay();
      }
    }
  };
  
  
  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
  
  function getRoots(a, b, c) {
    const root_one = -((-1 * b) + Math.sqrt((b * b) - (4 * a * c))) / (2 * a);
    const root_two = -((-1 * b) - Math.sqrt((b * b) - (4 * a * c))) / (2 * a);
    return `x = ${root_one} or ${root_two}`;
  }
  function getQuadraticQuestion(difficulty) {
    const answers = [];
    const squares = [0, 1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144, 169, 196, 225, 256];
    if (difficulty == "A-Level") {
      while (answers.length !== 4) {
        let a = 0;
        let b = 0;
        let c = 0;
        while (a == 0 || b == 0 || c == 0) {
          a = randomInt(-5, 5);
          b = randomInt(-30, 30);
          c = randomInt(-100, 100);
        }
        const roots = getRoots(a, b, c);
        let a_string = a.toString();
        let b_string = b > 0 ? "+" + b.toString() : b.toString();
        let c_string = c > 0 ? "+" + c.toString() : c.toString();
        a_string = a == "1" ? "" : a == "-1" ? "-" : a_string;
        b_string = b == "1" ? "+" : b == "-1" ? "-" : b_string;
        for (let i = 0; i < squares.length; i++) {
          if ((b * b) - (4 * a * c) == squares[i]) {
            if (!roots.includes(".")) {
              const exists = answers.find((r) => { r.roots == roots })
              if (!exists) {
                answers.push({ a_string, b_string, c_string, roots });
              }
            }
          }
        }
      }
    } else {
      while (answers.length !== 4) {
        let a = 1;
        let b = 0;
        let c = 0;
        while (b == 0 || c == 0) {
          b = randomInt(-30, 30);
          c = randomInt(-100, 100);
        }
        const roots = getRoots(a, b, c);
        let a_string = a.toString();
        let b_string = b > 0 ? "+" + b.toString() : b.toString();
        let c_string = c > 0 ? "+" + c.toString() : c.toString();
        a_string = a == "1" ? "" : a == "-1" ? "-" : a_string;
        b_string = b == "1" ? "+" : b == "-1" ? "-" : b_string;
        for (let i = 0; i < squares.length; i++) {
          if ((b * b) - (4 * a * c) == squares[i]) {
            if (!roots.includes(".")) {
              const exists = answers.find((r) => { r.roots == roots })
              if (!exists) {
                answers.push({ a_string, b_string, c_string, roots });
              }
            }
          }
        }
      }
    }
    let index = randomInt(0, answers.length - 1);
    const question = `${answers[index].a_string}x² ${answers[index].b_string}x ${answers[index].c_string} = 0`;
    answers[index].correct = true;
    return { question, answers };
  };

function storeScore(score) {
  if (!Dom.storage.score) {
    Dom.storage.score = 0;
  }
  let currentScore = Number(Dom.storage.score);
  currentScore += score;
  Dom.storage.score = currentScore;
  return;

}
function countQs() {
  if (!Dom.storage.totalQs) {
    Dom.storage.totalQs = 0;
  }
  let currentTotalQs = Number(Dom.storage.totalQs) + 1;
  Dom.storage.totalQs = currentTotalQs;
  return;

}
function incrementGamesPlayed() {
  if (!Dom.storage.totalGames) {
    Dom.storage.totalGames = 0;
  }
  let currentTotalGames = Number(Dom.storage.totalGames) + 1;
  Dom.storage.totalGames = currentTotalGames;
  return;
}

