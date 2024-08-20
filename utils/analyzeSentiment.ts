import { SentimentObject } from "./types";
import Sentiment from "sentiment";

export const sentimentObjectCopy: SentimentObject[] = [
  {
    label: "positive",
    value: 0, 
    fill: '#0000FF'
  },
  {
    label: "negative",
    value: 0,
    fill: '#FF0000'
  },
  {
    label: "neutral",
    value: 0, 
    fill: '#fef08a'
  },
]

export default function analyzeSentiment (comments: string[]) {

    const sentiment = new Sentiment()

    comments.map(comment => {
        const result = sentiment.analyze(comment).score
        if (result == 0) {
          sentimentObjectCopy[2].value++
        } else if (result > 0) {
          sentimentObjectCopy[0].value++
        } else {
          sentimentObjectCopy[1].value++
        }
    })

    return sentimentObjectCopy
}