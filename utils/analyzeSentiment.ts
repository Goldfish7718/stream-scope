import { ManualCommentType, SentimentObject } from "./types";
import Sentiment from "sentiment";

export default function analyzeSentiment(comments: string[]) {
  const sentiment = new Sentiment();
  const manualComments: ManualCommentType[] = [];

  const manualCommentCount = {
    "positive": 0,
    "negative": 0,
    "neutral": 0
  };

  const sentimentResults: SentimentObject[] = [
      { label: "positive", value: 0, fill: '#0000FF' },
      { label: "negative", value: 0, fill: '#FF0000' },
      { label: "neutral", value: 0, fill: '#fef08a' },
  ];

  comments.forEach(comment => {
      const result = sentiment.analyze(comment).score;

      if (result > 0) {
        sentimentResults[0].value++;
        if (manualCommentCount.positive < 2) {
          manualComments.push({ comment, score: result });
          manualCommentCount.positive++;
        }
      } else if (result < 0) {
        sentimentResults[1].value++;
        if (manualCommentCount.negative < 2) {
          manualComments.push({ comment, score: result });
          manualCommentCount.negative++;
        }
      } else {
        sentimentResults[2].value++;
        if (manualCommentCount.neutral < 2) {
          manualComments.push({ comment, score: result });
          manualCommentCount.neutral++;
        }
      }
  });

  return {
    sentimentResults,
    manualComments
  };
}
