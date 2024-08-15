"use client"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import extractVideoId from "@/utils/extractId";
import { getCommentModel } from "@/utils/initializeModel";
import axios from "axios";
import { useState } from "react";

export default function Home() {

  const [url, setUrl] = useState("");
  const [comments, setComments] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [numberOfComments, setNumberOfComments] = useState(1000);
  const [commentSummary, setCommentSummary] = useState("");

  const fetchComments = async () => {
    try {
      setLoading(true)
      setComments([])

      let nextPageToken;
      let res;
      let batchComments: string[] = []
      let fetchCount: number = numberOfComments / 100
      let currentFetchCount: number = 0

      const videoId = extractVideoId(url)

      do {
        res = await axios.get(`https://www.googleapis.com/youtube/v3/commentThreads?key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}&part=snippet&videoId=${videoId}&maxResults=100${nextPageToken ? `&pageToken=${nextPageToken}` : ""}`);

        const newComments = res.data.items.map((item: any) => {
          return item.snippet.topLevelComment.snippet.textOriginal
        })

        batchComments = [...batchComments, ...newComments]

        nextPageToken = res.data.nextPageToken
        currentFetchCount++
      } while (nextPageToken && currentFetchCount < fetchCount)

      console.log(batchComments);
      
      setComments(batchComments)
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false)
    }
  }

  const getCommentSummaries = async () => {
    try {
      const commentModel = getCommentModel()

      let result = await commentModel.generateContent(JSON.stringify(comments));
      let response = await result.response;
      let text = response.text();

      console.log(text);
      setCommentSummary(text)
    } catch (error) {
      console.log(error);
    }
  }

  const handleSubmit = async () => {
    await fetchComments()
    await getCommentSummaries()
  }

  return (
    <main className="mt-28">
      <section className="text-center flex flex-col gap-4">
        <h1 className="font-extrabold text-7xl bg-gradient-to-r from-pink-400 to-purple-300 bg-clip-text text-transparent">stream-scope</h1>
        <p className="text-lg font-light text-neutral-700">Get AI generated analysis of YouTube videos for free</p>
      </section>

      <div className="flex justify-center w-1/2 gap-2 mt-12 mx-auto">
        <Input className="w-2/3" placeholder="eg: https://www.youtube.com/watch?v=4r15Y4QVg2P8" onChange={e => setUrl(e.target.value)}/>
        <Button className="w-1/3" onClick={handleSubmit}>Analyze</Button>
      </div>

      <div className="flex flex-col items-center mt-12 gap-8">
        <Label className="text-lg text-neutral-700">Select number of comments for analysis</Label>
        <Slider
          defaultValue={[1000]}
          min={1000}
          max={5000}
          step={1000}
          onValueChange={value => setNumberOfComments(value[0])}
          value={[numberOfComments]}
          className="w-1/3"
        />

        <h3 className="text-xl font-bold text-neutral-900">{numberOfComments} comments</h3>
      </div>
    </main>
  );
}
