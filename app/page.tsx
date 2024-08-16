"use client"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import extractVideoId from "@/utils/extractId";
import { getCommentModel } from "@/utils/initializeModel";
import axios from "axios";
import { ChartNoAxesColumn, Clipboard, Loader2, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TextGenerateEffect } from "@/components/text-generate-effect";
import Sentiment from 'sentiment'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Pie, PieChart } from "recharts";

interface SentimentObject {
  label: string;
  value: number;
  fill: string;
}

export default function Home() {

  const [url, setUrl] = useState("");
  const [comments, setComments] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [numberOfComments, setNumberOfComments] = useState(1000);
  const [commentSummary, setCommentSummary] = useState("");
  const [sentimentObject, setSentimentObject] = useState<SentimentObject[]>([
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
      fill: '#808080'
    },
  ]);

  const chartConfig = {
    positive: {
      label: 'Positive',
    },
    negative: {
      label: 'Negative',
    },
    neutral: {
      label: 'Neutral',
    }
  } as ChartConfig

  const summaryRef = useRef<HTMLDivElement>(null)

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setComments([])
      setCommentSummary("")
      const sentiment = new Sentiment()

      let nextPageToken;
      let res;
      let batchComments: string[] = []

      const sentimentObjectCopy: SentimentObject[] = [
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
          fill: '#808080'
        },
      ]

      const videoId = extractVideoId(url)

      do {
        res = await axios.get(`https://www.googleapis.com/youtube/v3/commentThreads?key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}&part=snippet&videoId=${videoId}&maxResults=100${nextPageToken ? `&pageToken=${nextPageToken}` : ""}`);

        const newComments = res.data.items.map((item: any) => {
          return item.snippet.topLevelComment.snippet.textOriginal
        })

        batchComments = [...batchComments, ...newComments]

        nextPageToken = res.data.nextPageToken ? res.data.nextPageToken : null
      } while (nextPageToken && batchComments.length < numberOfComments)

      console.log(batchComments);
      
      batchComments.map(comment => {
        const result = sentiment.analyze(comment).score
        if (result == 0) {
          sentimentObjectCopy[2].value++
        } else if (result > 0) {
          sentimentObjectCopy[0].value++
        } else {
          sentimentObjectCopy[1].value++
        }
      })

      setSentimentObject(sentimentObjectCopy)
      console.log(sentimentObjectCopy);

      //  Generate comment summaries
      const commentModel = getCommentModel()

      let result = await commentModel.generateContent(JSON.stringify(batchComments.slice(0, 100)));
      let response = await result.response;
      let text = response.text();

      console.log(text);
      
      setCommentSummary(text)
      setComments(batchComments)
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (commentSummary) {
      if (summaryRef.current) {
        summaryRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [commentSummary])

  return (
    <main className="mt-28">
      <section className="text-center flex flex-col gap-4">
        <h1 className="font-extrabold text-7xl bg-gradient-to-r from-pink-400 to-purple-300 bg-clip-text text-transparent">stream-scope</h1>
        <p className="text-lg font-light text-neutral-700">Get AI generated analysis of YouTube videos for free</p>
      </section>

      <div className="flex justify-center w-1/2 gap-2 mt-12 mx-auto">
        <Input className="w-2/3" placeholder="eg: https://www.youtube.com/watch?v=4r15Y4QVg2P8" onChange={e => setUrl(e.target.value)}/>
        <Button className="w-1/3" onClick={handleSubmit} disabled={loading}>
          {loading ? <Loader2 className="animate-spin duration-300" /> : 'Analyze'}
        </Button>
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

      {commentSummary && 
        <section className="my-12 flex" ref={summaryRef}>
          <Card className="w-1/2 m-4">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle className="flex items-center">
                AI-generated summary
                <Sparkles size={28} className="mx-2" />
              </CardTitle>
              <Button variant='outline' size='sm'><Clipboard size={16} /></Button>
            </CardHeader>
            <Separator />
            <CardContent className="p-4">
              <TextGenerateEffect words={commentSummary} />
            </CardContent>
            <Separator />
            <CardFooter className="p-4">
              <p className="text-neutral-600 text-sm">This summary is only generated on 100 comments due to token constraints and may not be entirely accurate</p>
            </CardFooter>
          </Card>
          <Card className="w-1/2 m-4 h-fit">
            <CardHeader>
              <CardTitle className="flex items-center">
                Sentiment Analysis
                <ChartNoAxesColumn size={28} className="mx-2" />
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="p-4">
              <ChartContainer
                config={chartConfig}
                className="mx-auto aspect-square max-h-[250px]"
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie data={sentimentObject} dataKey="value" nameKey="label" />
                </PieChart>
              </ChartContainer>

              <p className="text-center text-neutral-700 mt-6">Total Postive comments: {sentimentObject[0].value}</p>
            </CardContent>
          </Card>
        </section>
      }
    </main>
  );
}
