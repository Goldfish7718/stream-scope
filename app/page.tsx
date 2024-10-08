"use client"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import axios from "axios";
import { ChartNoAxesColumn, Clipboard, Loader2, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TextGenerateEffect } from "@/components/text-generate-effect";
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Pie, PieChart } from "recharts";
import { analyzeSentiment, extractVideoId, generateSummary } from "@/utils";
import { ManualCommentType, SentimentObject } from "@/utils/types";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import CountUp from "react-countup";

export default function Home() {

  const [url, setUrl] = useState("");
  const [comments, setComments] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [numberOfComments, setNumberOfComments] = useState(1000);
  const [commentSummary, setCommentSummary] = useState("");
  const [sentimentObject, setSentimentObject] = useState<SentimentObject[]>([]);
  const [progress, setProgress] = useState(0);
  const [manualComments, setManualComments] = useState<ManualCommentType[]>([]);

  const graphRef = useRef<HTMLDivElement>(null)
  const topRef = useRef<HTMLDivElement>(null)

  const { toast } = useToast()

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

  const handleSubmit = async () => {
    try {

      setLoading(true)
      setComments([])
      setCommentSummary("")
      setSentimentObject([])

      setProgress(10)

      let nextPageToken;
      let batchComments: string[] = []

      const videoId = extractVideoId(url)

      setProgress(20)

      let iteration = 0;
      const maxIterations = 50;

      do {
        const res: any = await axios.get(`https://www.googleapis.com/youtube/v3/commentThreads`, {
          params: {
            key: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY,
            part: 'snippet',
            videoId,
            maxResults: 100,
            pageToken: nextPageToken || ""            
          }
        })

        const newComments = res.data.items.map((item: any) => {
          return item.snippet.topLevelComment.snippet.textOriginal
        })

        batchComments = [...batchComments, ...newComments]

        nextPageToken = res.data.nextPageToken ? res.data.nextPageToken : null

        iteration++;
        setProgress(20 + (iteration / maxIterations) * 80);
      } while (nextPageToken && batchComments.length < numberOfComments)

      setProgress(100)

      const sentimentResults = analyzeSentiment(batchComments)

      setSentimentObject(sentimentResults.sentimentResults)
      setManualComments(sentimentResults.manualComments)
      setCommentSummary(await generateSummary(batchComments))

      setComments(batchComments)

    } catch (error) {
      console.log(error);
      toast({
        title: "Sorry, an error occured",
        description: "Please try later",
        variant: "destructive",
        duration: 3000
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    navigator.clipboard.writeText(commentSummary).then(() => {
      toast({
        title: "Copied to clipboard",
        duration: 1000
      })
    })
  }

  const generateColor = (score: number)  => {
    if (score > 0) {
      return `bg-blue-200 text-blue-700 py-1 px-2 rounded-md`
    } else if (score < 0) {
      return `bg-red-200 text-red-700 py-1 px-2 rounded-md`
    } else {
      return `bg-yellow-200 text-yellow-700 py-1 px-2 rounded-md`
    }
  }

  useEffect(() => {
    if (commentSummary) {
      if (graphRef.current) {
        graphRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      }
    } else {
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: "end" })
    }
  }, [commentSummary])

  return (
    <main className="mt-28">
      <div ref={topRef}></div>
      <section className="text-center flex flex-col gap-4">
        <h1 className="font-extrabold text-4xl sm:text-5xl md:text-7xl bg-gradient-to-r from-pink-400 to-purple-300 bg-clip-text text-transparent">stream-scope</h1>
        <p className="text-lg md:text-xl font-light text-neutral-700 mx-2 sm:mx-0">Get AI generated analysis of YouTube videos for free</p>
      </section>

      <div className="flex justify-center gap-2 mt-12 mx-2">
        <Input className="md:w-[30%] sm:w-3/5 w-2/3" placeholder="eg: https://www.youtube.com/watch?v=4r15Y4QVg2P8" onChange={e => setUrl(e.target.value)}/>
        <Button className="md:w-1/5 sm:w-2/5 w-1/3" onClick={handleSubmit} disabled={loading}>
          {loading ? <Loader2 className="animate-spin duration-300" /> : 'Analyze'}
        </Button>
      </div>

      <div className="flex flex-col items-center mt-12 gap-8 mx-2">
        <Label className="text-sm sm:text-lg text-neutral-700">Select number of comments for analysis</Label>
        <Slider
          defaultValue={[1000]}
          min={1000}
          max={5000}
          step={1000}
          onValueChange={value => setNumberOfComments(value[0])}
          value={[numberOfComments]}
          className="w-1/3"
        />

        <h3 className="text-lg md:text-xl font-bold text-neutral-900">{numberOfComments} comments</h3>
      </div>

      {loading && 
        <div className="flex flex-col items-center my-6 gap-1">
          <Progress value={progress} className="w-1/2" />
          <div>
            <CountUp 
              preserveValue={true} 
              end={Math.round(progress)} 
              useEasing={false}
              duration={.5}
            />
            <span>%</span>
          </div>
        </div>
      }

      {commentSummary && 
        <section className="my-12">
          <div className="my-4 flex flex-col-reverse md:flex-row">
            {/* AI SUMMARY */}
            <Card className="md:w-1/2 m-4">
              <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle className="flex items-center">
                  AI-generated summary
                  <Sparkles size={28} className="mx-2" />
                </CardTitle>
                <Button variant='outline' size='sm' onClick={copyToClipboard}><Clipboard size={16} /></Button>
              </CardHeader>
              <Separator />
              <CardContent className="p-4">
                <TextGenerateEffect words={commentSummary} />
              </CardContent>
              {/* <Separator /> */}
              <CardFooter className="p-4">
                <p className="text-yellow-700 text-sm bg-yellow-100 rounded-md py-2 px-4">This summary is only generated on 100 comments due to token constraints and may not be entirely accurate</p>
              </CardFooter>
            </Card>

            {/* SENTIMENT ANALYSIS PIE CHART */}
            <Card className="md:w-1/2 m-4" ref={graphRef}>
              <CardHeader className="flex">
                <CardTitle className="flex items-center">
                  Sentiment Analysis
                  <ChartNoAxesColumn size={28} className="mx-2" />
                </CardTitle>
                <p className="text-sm text-neutral-400 self-start">&#40;{comments.length} comments fetched&#41;</p>
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
                    <Pie data={sentimentObject} dataKey="value" nameKey="label" label />
                    <ChartLegend 
                      content={<ChartLegendContent nameKey="label" />}
                      />
                  </PieChart>
                </ChartContainer>

                <div className="mt-6 flex gap-2 justify-center">
                  <h4 className="bg-blue-200 text-blue-700 p-1 rounded-md">{((sentimentObject[0].value / comments.length) * 100).toFixed(1)}%</h4>
                  <h4 className="bg-red-200 text-red-700 p-1 rounded-md">{((sentimentObject[1].value / comments.length) * 100).toFixed(1)}%</h4>
                  <h4 className="bg-yellow-200 text-yellow-700 p-1 rounded-md">{((sentimentObject[2].value / comments.length) * 100).toFixed(1)}%</h4>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid sm:grid-cols-2 grid-cols-1">
            {manualComments.map((commentObj, index) => (
              <Card className="m-2" key={index}>
                <CardContent className="p-4">
                  <h3>{commentObj.comment}</h3>
                </CardContent>
                <CardFooter>
                  <h3 className={generateColor(commentObj.score)}>{commentObj.score > 0 ? "Postive" : commentObj.score < 0 ? "Negative" : "Neutral"}</h3>
                </CardFooter>
              </Card>
            ))
            }
          </div>
        </section>
      }
    </main>
  );
}
