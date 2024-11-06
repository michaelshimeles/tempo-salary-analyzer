"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"
import { Loader2, DollarSign, LineChart, Brain, BadgeCheck } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function Component() {
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [analysis, setAnalysis] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setAnalysis("")
    setError("")

    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        throw new Error("Failed to analyze job posting")
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const text = decoder.decode(value)
          setAnalysis(prev => prev + text)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-500">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col justify-center items-center w-full min-h-screen p-4"
      >
        <div className="flex flex-col justify-start items-start w-full max-w-4xl gap-6">
          <motion.div
            initial={fadeIn.initial}
            animate={fadeIn.animate}
            className="w-full"
          >
            <Card className="overflow-hidden border-none shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg">
              <CardHeader className="space-y-1">
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    AI Salary Predictor
                  </CardTitle>
                </motion.div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="flex flex-wrap gap-3">
                  <div className="flex-1 relative group">
                    <Input
                      placeholder="Enter Lever job posting URL..."
                      value={url}
                      onChange={(e: any) => setUrl(e.target.value)}
                      disabled={isLoading}
                      className="bg-white dark:bg-gray-900 transition-all duration-300 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary"
                    />
                    <div className="absolute inset-0 -z-10 bg-primary/10 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 rounded-lg" />
                  </div>
                  <Button
                    disabled={isLoading}
                    type="submit"
                    className="relative overflow-hidden transition-all duration-300"
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoading ? 'Analyzing...' : 'Predict Salary'}
                    <div className="absolute inset-0 -z-10 bg-primary/20 opacity-0 hover:opacity-100 transition-opacity duration-300" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="error"
                {...fadeIn}
                className="w-full"
              >
                <Card className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                  <CardContent className="p-4 text-red-600 dark:text-red-400">
                    {error}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {analysis && (
              <motion.div
                key="analysis"
                {...fadeIn}
                className="w-full"
              >
                <Card className="shadow-lg border-none bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg">
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-4">
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center gap-2 text-primary"
                      >
                        <LineChart className="w-5 h-5" />
                        <h3 className="font-semibold">Salary Prediction</h3>
                      </motion.div>
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="flex items-center gap-2 text-primary"
                      >
                        <Brain className="w-5 h-5" />
                        <h3 className="font-semibold">Analysis</h3>
                      </motion.div>
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="flex items-center gap-2 text-primary"
                      >
                        <BadgeCheck className="w-5 h-5" />
                        <h3 className="font-semibold">Confidence Level</h3>
                      </motion.div>
                    </div>
                    <div className="prose prose-gray dark:prose-invert max-w-none">
                      <div className="whitespace-pre-wrap">{analysis}</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}