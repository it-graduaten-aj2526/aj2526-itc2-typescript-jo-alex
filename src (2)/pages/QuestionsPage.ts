import { quiz, quizPage } from "../globals.ts";
import { QuestionMode } from "../types/enum/QuestionMode.ts";
import { QuestionService } from "../services/QuestionService.ts";
import { ICategory } from "../types/interfaces/ICategory.ts";
import { Difficulty } from "../types/enum/Difficulty.ts";
import { displayAlert, getElementWrapper } from "../utils";
import Question from "../models/Question.ts";

const questionService = new QuestionService();

const apiModeHtml: string = `
    <h2>API questions</h2>
    <p>Configure the API for retrieving questions</p>

    <label for="input-difficulty" class="form-label">Difficulty</label>
    <select class="form-select" id="input-difficulty" data-testid="input-difficulty"></select>

    <label for="input-category" class="form-label mt-2">Theme</label>
    <select class="form-select" id="input-category" data-testid="input-category"></select>

    <button id="btn-fetch-questions" class="btn btn-primary mt-2" data-testid="btn-fetch-questions">
        Fetch questions
    </button>
`;

const customModeHtml: string = `
    <h2>Custom questions</h2>

    <div class="row mb-3">
        <label for="input-question" class="col-sm-2 col-form-label">Question</label>
        <div class="col-sm-10">
            <input class="form-control" id="input-question" data-testid="input-question">
        </div>
    </div>

    <div class="row mb-3">
        <label for="input-correct-answer" class="col-sm-2 col-form-label">Correct answer</label>
        <div class="col-sm-10">
            <input class="form-control" id="input-correct-answer" data-testid="input-correct-answer">
        </div>
    </div>

    <div class="row mb-3">
        <label for="input-incorrect-answer" class="col-sm-2 col-form-label">Incorrect answer</label>
        <div class="col-sm-10">
            <div class="input-group">
                <input id="input-incorrect-answer" type="text" class="form-control" data-testid="input-incorrect-answer">
                <button class="btn btn-outline-secondary" type="button" id="btn-add-incorrect-answer" data-testid="btn-add-incorrect-answer">
                    Add
                </button>
            </div>
        </div>
    </div>

    <table class="table table-bordered">
        <thead>
        <tr>
            <th scope="col">Question</th>
            <th scope="col">Correct answer</th>
            <th scope="col">Incorrect answers</th>
        </tr>
        </thead>
        <tbody>
        <tr>
            <td id="output-question" data-testid="output-question"></td>
            <td>
                <ul id="output-correct-answer" data-testid="output-correct-answer"></ul>
            </td>
            <td>
                <ul id="output-incorrect-answers" data-testid="output-incorrect-answers"></ul>
            </td>
        </tr>
        </tbody>
    </table>

    <button type="submit" class="btn btn-primary" id="btn-submit-question" data-testid="btn-submit-question">
        Submit question
    </button>
`;

const questionsHtml: string = `
    <h2 class="mt-2">
        Confirmed questions
        <span id="question-counter" data-testid="question-counter">(0/0)</span>
    </h2>

    <div id="questions" data-testid="questions">
        No questions to display
    </div>
`;

const fillDifficulty = () => {
    const select = getElementWrapper<HTMLSelectElement>("#input-difficulty");

    select.innerHTML = `
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
    `;
};

const fillCategories = async () => {
    const select = getElementWrapper<HTMLSelectElement>("#input-category");
    select.innerHTML = '';

    const categories = await questionService.getCategories();

    categories.forEach((c: ICategory) => {
        const option = document.createElement("option");
        option.value = c.id.toString();
        option.text = c.name;
        select.appendChild(option);
    });
};

export class QuestionsPage {
    private tempQuestion = new Question("");

    private updateQuestions() {
        const questionsDiv = getElementWrapper<HTMLDivElement>('#questions');

        questionsDiv.innerHTML = '';

        if (quiz.questions.length === 0) {
            questionsDiv.textContent = 'No questions to display';
        } else {
            quiz.questions.forEach(q => {
                const p = document.createElement('p');

                p.textContent =
                    `Question: ${q.question} | Answers: ${q.answers.map(a => a.text).join(", ")}`;

                questionsDiv.appendChild(p);
            });
        }

        getElementWrapper<HTMLSpanElement>('#question-counter').textContent =
            `(${quiz.questions.length}/${quiz.quizDuration})`;

        getElementWrapper<HTMLButtonElement>('#btn-start-quiz').disabled = quiz.questions.length < quiz.quizDuration;
    }

    private updateCustomQuestionPreview() {
        const questionInput = getElementWrapper<HTMLInputElement>('#input-question');
        const correctAnswerInput = getElementWrapper<HTMLInputElement>('#input-correct-answer');

        getElementWrapper<HTMLTableCellElement>('#output-question').textContent =
            questionInput.value;

        const correctAnswerOutput =
            getElementWrapper<HTMLUListElement>('#output-correct-answer');

        correctAnswerOutput.innerHTML = '';

        if (correctAnswerInput.value.trim()) {
            const li = document.createElement('li');
            li.textContent = correctAnswerInput.value;
            correctAnswerOutput.appendChild(li);
        }
    }

    private addIncorrectAnswer() {
        const input = getElementWrapper<HTMLInputElement>('#input-incorrect-answer');
        const value = input.value.trim();

        if (!value) {
            displayAlert("Enter an incorrect answer");
            return;
        }

        this.tempQuestion.addAnswer({
            text: value,
            isCorrect: false
        });

        const output = getElementWrapper<HTMLUListElement>('#output-incorrect-answers');
        const li = document.createElement('li');

        li.textContent = value;
        output.appendChild(li);

        input.value = '';
    }

    private submitCustomQuestion() {
        const questionInput = getElementWrapper<HTMLInputElement>('#input-question');
        const correctAnswerInput = getElementWrapper<HTMLInputElement>('#input-correct-answer');

        const questionValue = questionInput.value.trim();
        const correctAnswerValue = correctAnswerInput.value.trim();

        if (!questionValue || !correctAnswerValue) {
            displayAlert("Fill in the question and correct answer");
            return;
        }

        if (questionValue.split(" ").length < 4) {
            displayAlert("Question must contain at least 4 words");
            return;
        }

        const incorrectAnswers = this.tempQuestion.answers.filter(a => !a.isCorrect);

        if (incorrectAnswers.length === 0) {
            displayAlert("Add at least one incorrect answer");
            return;
        }

        const question = new Question(questionValue);

        question.addAnswer({
            text: correctAnswerValue,
            isCorrect: true
        });

        incorrectAnswers.forEach(a => question.addAnswer(a));

        quiz.addQuestion(question);

        this.updateQuestions();

        questionInput.value = '';
        correctAnswerInput.value = '';
        getElementWrapper<HTMLInputElement>('#input-incorrect-answer').value = '';

        getElementWrapper<HTMLTableCellElement>('#output-question').textContent = '';
        getElementWrapper<HTMLUListElement>('#output-correct-answer').innerHTML = '';
        getElementWrapper<HTMLUListElement>('#output-incorrect-answers').innerHTML = '';

        this.tempQuestion = new Question("");
    }

    private async fetchQuestions() {
        const difficulty = getElementWrapper<HTMLSelectElement>('#input-difficulty').value;
        const categoryValue = getElementWrapper<HTMLSelectElement>('#input-category').value;

        if (!difficulty) {
            displayAlert("Choose difficulty first");
            return;
        }

        const category = parseInt(categoryValue);

        // Een nieuwe fetch vervangt altijd de vorige API-vragen.
        quiz.questions = [];
        this.updateQuestions();

        const questions = await questionService.getQuestions(
            quiz.quizDuration,
            category,
            difficulty as Difficulty
        );

        questions.forEach(question => {
            quiz.addQuestion(question);
        });

        this.updateQuestions();
    }

    public async init(contentElement: HTMLElement) {
        const htmlToShow =
            quiz.getQuestionMode() === QuestionMode.Api
                ? apiModeHtml
                : customModeHtml;

        const fullHtml = `
            <div class="row">
                <div class="col">
                    <p data-testid="intro">
                        A quiz can not start without questions.
                        Add questions to the quiz by fetching them
                        from an API or by adding them manually.
                    </p>
                </div>
            </div>

            <div class="row">
                <div class="col">${htmlToShow}</div>
                <div class="col">${questionsHtml}</div>
            </div>

            <hr>

            <div class="row">
                <div class="col">
                    <button class="btn btn-success w-100"
                            id="btn-start-quiz"
                            data-testid="btn-start-quiz"
                            disabled>
                        Start quiz
                    </button>
                </div>
            </div>
        `;

        contentElement.innerHTML = fullHtml;

        getElementWrapper<HTMLButtonElement>('#btn-start-quiz')
            .addEventListener('click', () => {
                quiz.startQuiz();
                quizPage.init(getElementWrapper('#content'));
            });

        if (quiz.getQuestionMode() === QuestionMode.Api) {
            fillDifficulty();

            try {
                await fillCategories();
            } catch {
                displayAlert("Themes could not be loaded");
            }

            getElementWrapper<HTMLButtonElement>('#btn-fetch-questions')
                .addEventListener('click', () => this.fetchQuestions());
        }

        if (quiz.getQuestionMode() === QuestionMode.Custom) {
            getElementWrapper<HTMLInputElement>('#input-question')
                .addEventListener('input', () => this.updateCustomQuestionPreview());

            getElementWrapper<HTMLInputElement>('#input-correct-answer')
                .addEventListener('input', () => this.updateCustomQuestionPreview());

            getElementWrapper<HTMLButtonElement>('#btn-add-incorrect-answer')
                .addEventListener('click', () => this.addIncorrectAnswer());

            getElementWrapper<HTMLButtonElement>('#btn-submit-question')
                .addEventListener('click', () => this.submitCustomQuestion());
        }
    }
}