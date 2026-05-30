import Question from "../models/Question";
import { IApiQuestion } from "../types/interfaces/IApiQuestion.ts";
import { ICategory } from "../types/interfaces/ICategory.ts";

export class QuestionService {
    baseUrl: string = 'https://opentdb.com/api.php?';
    categoryUrl: string = 'https://opentdb.com/api_category.php';

    getCategories = async (): Promise<ICategory[]> => {
        const response = await fetch(this.categoryUrl);
        const data = await response.json();

        return data.trivia_categories;
    }

    getQuestions = async (
        amount: number,
        category: number,
        difficulty: string
    ): Promise<Question[]> => {

        const url =
            `${this.baseUrl}amount=${amount}&category=${category}&difficulty=${difficulty}&type=multiple`;

        const response = await fetch(url);
        const data = await response.json();

        return this.mapQuestionsToQuestionModel(data.results);
    }

    mapQuestionsToQuestionModel = (questions: IApiQuestion[]): Question[] => {

        const questionList: Question[] = [];

        for (const q of questions) {

            const question = new Question(q.question);

            question.addAnswer({
                text: q.correct_answer,
                isCorrect: true
            });

            q.incorrect_answers.forEach(a =>
                question.addAnswer({
                    text: a,
                    isCorrect: false
                })
            );

            questionList.push(question);
        }

        return questionList;
    }
}