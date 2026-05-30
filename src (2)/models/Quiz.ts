import Question from "./Question";
import Player from "./Player";
import { QuestionMode } from "../types/enum/QuestionMode";
import { GameMode } from "../types/enum/GameMode.ts";

export class Quiz {
    public isRunning: boolean = false;
    public questions: Question[] = [];
    public quizDuration: number = 0;
    public players: Player[] = [];
    private currentQuestionIndex: number;
    private currentPlayerIndex: number;
    private gameMode: GameMode;
    private questionMode: QuestionMode;
    private numberOfPlayers: number = 1;
    private totalAmountOfQuestionToBeAsked: number = 0;
    private amountOfQuestionsAlreadyAsked: number = 0;

    public constructor(duration: number) {
        this.quizDuration = duration;
        this.currentQuestionIndex = 0;
        this.currentPlayerIndex = 0;
        this.gameMode = GameMode.Single;
        this.questionMode = QuestionMode.Custom;
    }

    public getGameMode() { return this.gameMode; }

    public getQuestionMode(): QuestionMode { return this.questionMode; }

    public getNumberOfPlayers(): number { return this.numberOfPlayers; }

    public getCurrentPlayerName(): string { return this.players[this.currentPlayerIndex]?.name ?? ""; }

    public getCurrentQuestion() { return this.questions[this.currentQuestionIndex]; }

    public updateCurrentPlayerScore(amount: number) {
        this.players[this.currentPlayerIndex]?.updateScore(amount);
    }

    public setQuestionMode(mode: QuestionMode) { this.questionMode = mode; }

    private updateTotalAmountOfQuestionToBeAsked() {
        this.totalAmountOfQuestionToBeAsked = this.questions.length * this.getAmountOfPlayers();
    }

    public addQuestion(q: Question) {
        this.questions.push(q);
        this.updateTotalAmountOfQuestionToBeAsked();
    }

    public addPlayer(name: string) {
        this.players.push(new Player(name));
    }

    private getAmountOfPlayers() { return this.players.length > 0 ? this.players.length : this.numberOfPlayers; }

    public removePlayer(name: string) {
        this.players = this.players.filter(player => player.name !== name);
        if (this.currentPlayerIndex >= this.players.length) {
            this.currentPlayerIndex = 0;
        }
        this.updateTotalAmountOfQuestionToBeAsked();
    }

    public startQuiz() {
        this.isRunning = true;
        this.currentQuestionIndex = 0;
        this.currentPlayerIndex = 0;
        this.amountOfQuestionsAlreadyAsked = 0;
        this.updateTotalAmountOfQuestionToBeAsked();
        this.shuffleAnswersInQuestions();
    }

    public testIfAnswerIsCorrect(answer: string) {
        return this.getCurrentQuestion()?.answers.some(currentAnswer => currentAnswer.text === answer && currentAnswer.isCorrect) ?? false;
    }

    public nextQuestion() {
        if (!this.isRunning) {
            return;
        }

        this.amountOfQuestionsAlreadyAsked++;

        if (this.amountOfQuestionsAlreadyAsked >= this.totalAmountOfQuestionToBeAsked) {
            this.endQuiz();
            return;
        }

        // Deze volgorde laat elke speler dezelfde vragenronde afwerken.
        this.currentQuestionIndex++;
        if (this.currentQuestionIndex >= this.questions.length) {
            this.currentQuestionIndex = 0;
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.getAmountOfPlayers();
        }
    }

    private shuffleAnswersInQuestions() { }

    private endQuiz() { this.isRunning = false; }

    public setGameMode(gameMode: GameMode, amountOfPlayers: number) {
        this.gameMode = gameMode;
        this.numberOfPlayers = amountOfPlayers;
        this.currentQuestionIndex = 0;
        this.currentPlayerIndex = 0;
        this.updateTotalAmountOfQuestionToBeAsked();
    }

    public sortPlayersByScore() {
        return [...this.players].sort((playerA, playerB) => playerB.score - playerA.score);
    }

    public resetGame() {
        this.isRunning = false;
        this.questions = [];
        this.players = [];
        this.quizDuration = 0;
        this.gameMode = GameMode.Single;
        this.questionMode = QuestionMode.Custom;
        this.numberOfPlayers = 1;
        this.currentQuestionIndex = 0;
        this.currentPlayerIndex = 0;
        this.totalAmountOfQuestionToBeAsked = 0;
        this.amountOfQuestionsAlreadyAsked = 0;
    }
}
