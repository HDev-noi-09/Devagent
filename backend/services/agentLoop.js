import OpenAI from 'openai'
import { searchCodebase, getFile, listFiles, findReferences ,searchByFilename,
  suggestFix,
  fetchDocsForTool} from './tools.js'

const {GROQ_API_KEY} =process.env

if(!GROQ_API_KEY)
    {throw new Error("Something wrong with LLM working")
}


const groq = new OpenAI({
  apiKey: GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
})

const tools = [
  {
    type: "function",
    function: {
      name: "search_codebase",
      description: "Search codebase semantically for relevant code chunks",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_file",
      description: "Get full content of a file by its exact path",
      parameters: {
        type: "object",
        properties: {
          filePath: { type: "string" }
        },
        required: ["filePath"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_files",
      description: "List all files in the uploaded project",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "find_references",
      description: "Find where a function or variable is used across files",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" }
        },
        required: ["name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_by_filename",
      description: "Find files by name pattern",
      parameters: {
        type: "object",
        properties: {
          pattern: { type: "string" }
        },
        required: ["pattern"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "suggest_fix",
      description: "Generate before/after fix for a bug in a specific file",
      parameters: {
        type: "object",
        properties: {
          filePath: { type: "string" },
          bugDescription: { type: "string" }
        },
        required: ["filePath", "bugDescription"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "fetch_docs",
      description: "Fetch official documentation for a technology",
      parameters: {
        type: "object",
        properties: {
          technology: { type: "string" },
          query: { type: "string" }
        },
        required: ["technology", "query"]
      }
    }
  }
]

const agentSystemPrompt = `You are an expert code review assistant analyzing an uploaded codebase.
You have access to 7 tools to explore the codebase:
- search_codebase: semantically search for relevant code
- get_file: get full content of a specific file
- list_files: see all files in the project
- find_references: find where a function or variable is used
- search_by_filename: find files by name or pattern
- suggest_fix: generate before/after fix for a specific bug
- fetch_docs: fetch relevant official documentation

Rules:
- Always explore the codebase using tools before answering
- Never rewrite full files — point out issues and suggest targeted fixes
- Always mention exact file paths when possible
- When you find a bug, use suggest_fix to generate a precise before/after fix
- If user asks about a concept or API, use fetch_docs to get official documentation
- Be specific and concise in your answers
- NEVER mention tool names in your response — present findings naturally
- NEVER say "I used suggest_fix" or "list_files returned" — just present the results
- For simple conversational messages like greetings or thanks, respond naturally WITHOUT calling any tools
- Only use tools when the user is asking a technical question about the codebase
- ALWAYS be honest about fetching documentation — if you used fetch_docs, say "According to the official docs..." or "From the documentation..."
- Never deny using a tool when you actually used it
- When presenting code from docs, always mention the source

And at end , give responses,suggestions or outputs keeping in mind , the user's query and overall 
complexity of the entire codebase.
`

const learningSystemPrompt = `You are a strict coding mentor. Your ONLY job is to help developers learn — never to give direct answers.

You have access to 7 tools:
- search_codebase: semantically search for relevant code
- get_file: get full content of a specific file
- list_files: see all files in the project
- find_references: find where a function or variable is used
- search_by_filename: find files by name or pattern
- suggest_fix: generate before/after fix — use ONLY if user asks 3+ times
- fetch_docs: fetch official documentation — use this if whenever needed , instead of explaining yourself

STRICT Rules:
- ALWAYS call fetch_docs when explaining any concept or technology
- NEVER give direct answers — only hints and guiding questions
- When user asks to explain something, call get_file first, then fetch_docs
- Ask "what do you think this does?" and likewise questions, before explaining anything to push user to learn
- Point to specific line numbers and ask the user to figure it out
- Only reveal full answer if user explicitly says "just tell me" or asks 3+ times
- NEVER mention tool names in responses
- For greetings or thanks respond naturally without tools
- For ALL technical questions always use tools first
- If fetch_docs fails once, do NOT retry it — instead give hints directly from the code
- Never spend more than 2 iterations on fetch_docs
- ONLY reference files that exist in CURRENT PROJECT FILES listed above
- NEVER assume file names — always check the project files list first
- Detect the technology from the actual files, never assume
`

const MAX_TOOL_RESULT_CHARS = 8000

const truncateToolResult = (result) => {
  const str = JSON.stringify(result)
  if (str.length > MAX_TOOL_RESULT_CHARS) {
    return str.slice(0, MAX_TOOL_RESULT_CHARS) + "\n... [truncated due to size]"
  }
  return str
}


const executeTool = async (toolName, toolArgs) => {
  switch (toolName) {
    case "search_codebase":
      return await searchCodebase(toolArgs.query)
    case "get_file":
      return getFile(toolArgs.filePath)
    case "list_files":
      return listFiles()
    case "find_references":
      return findReferences(toolArgs.name)
    case "search_by_filename":
      return searchByFilename(toolArgs.pattern)
    case "suggest_fix":
      return await suggestFix(toolArgs.filePath, toolArgs.bugDescription)
    case "fetch_docs":
      return await fetchDocsForTool(toolArgs.technology, toolArgs.query)
    default:
      throw new Error(`Unknown tool: ${toolName}`)
  }
}



const agentLoop = async (userQuestion, chatHistory=[], mode = "agent") => {
  const systemPrompt = mode === "learning"
    ? learningSystemPrompt
    : agentSystemPrompt

      const { getFileTree } = await import('../utils/projectStore.js')
  const fileTree = getFileTree()
  
  
  const contextualSystemPrompt = fileTree.length > 0
    ? `${systemPrompt}

CURRENT PROJECT FILES:
${fileTree.join('\n')}

IMPORTANT: This is the ONLY project loaded. Only reference files from the list above. Never assume files that are not in this list.`
    : systemPrompt


  const messages = [
    { role: "system", content: contextualSystemPrompt },
    ...chatHistory,
    { role: "user", content: userQuestion }
  ]

  const MAX_ITERATIONS = 6

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      tools,
      tool_choice: "auto",
      max_tokens: 2048,
    })

    const choice = response.choices[0]
    const finishReason = choice.finish_reason

    if (finishReason === "stop") {
      return choice.message.content
    }

    if (finishReason === "tool_calls") {
      const toolCalls = choice.message.tool_calls
      console.log("Tool calls:", JSON.stringify(toolCalls, null, 2))
      messages.push(choice.message)

      for (const toolCall of toolCalls) {
        const toolName = toolCall.function.name
        

        let toolResult

        try {
          const toolArgs = JSON.parse(toolCall.function.arguments)
          toolResult = await executeTool(toolName, toolArgs)

        } catch (error) {
          toolResult = `Tool error: ${error.message}`
        }

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: truncateToolResult(toolResult)
        })
      }
    } else if (finishReason === "length") {
      return "My response was too long and got cut off. Please ask a more specific question."
    } else {
      return "An unexpected issue occurred. Please try again."
    }
  }

  return "I was unable to find a complete answer within the allowed steps. Please try rephrasing your question."
}

export { agentLoop }