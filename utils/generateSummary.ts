import { getCommentModel } from "./initializeModel";

export default async function generateSummary (comments: string[]) {
    const commentModel = getCommentModel()

    let result = await commentModel.generateContent(JSON.stringify(comments.slice(0, 100)));
    let response = await result.response;
    let text = response.text();

    return text
}