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
      description: "Semantically search through the uploaded codebase to find relevant code chunks based on a query",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query to find relevant code"
          }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_file",
      description: "Get the full content of a specific file by its path",
      parameters: {
        type: "object",
        properties: {
          filePath: {
            type: "string",
            description: "The exact file path to fetch"
          }
        },
        required: ["filePath"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_files",
      description: "List all files in the uploaded project to understand its structure",
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
      description: "Find all places where a specific function or variable is used across the codebase",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "The function or variable name to search for"
          }
        },
        required: ["name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_by_filename",
      description: "Search for files by their name or pattern — use this when you need to find a specific file directly",
      parameters: {
        type: "object",
        properties: {
          pattern: {
            type: "string",
            description: "The filename or pattern to search for"
          }
        },
        required: ["pattern"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "suggest_fix",
      description: "Generate a before/after code fix suggestion for a specific bug in a file",
      parameters: {
        type: "object",
        properties: {
          filePath: {
            type: "string",
            description: "The path of the file containing the bug"
          },
          bugDescription: {
            type: "string",
            description: "Clear description of the bug to fix"
          }
        },
        required: ["filePath", "bugDescription"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "fetch_docs",
      description: "Fetch relevant official documentation for a technology or concept",
      parameters: {
        type: "object",
        properties: {
          technology: {
            type: "string",
            description: "The technology to fetch docs for e.g. javascript, node, react, python"
          },
          query: {
            type: "string",
            description: "The specific concept or topic to search in the docs"
          }
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

And at end , give responses,suggestions or outputs keeping in mind , the user's query and overall 
complexity of the entire codebase.
`

const learningSystemPrompt = `You are a coding mentor helping a developer learn from their own codebase.
You have access to 7 tools to explore the codebase:
- search_codebase: semantically search for relevant code
- get_file: get full content of a specific file
- list_files: see all files in the project
- find_references: find where a function or variable is used
- search_by_filename: find files by name or pattern
- suggest_fix: generate before/after fix for a specific bug
- fetch_docs: fetch relevant official documentation

Rules:
- Never give direct answers — guide the developer to find them
- Give hints and ask guiding questions instead of solutions
- Point to the right file and area without revealing the fix
- Use fetch_docs to point user to relevant documentation instead of explaining yourself
- Only reveal full fix if user explicitly asks for it multiple times
- Encourage the developer to think through the problem themselves
- Be patient, supportive and educational in tone`

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

  const messages = [
    { role: "system", content: systemPrompt },
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
      max_tokens: 1024,
    })

    const choice = response.choices[0]
    const finishReason = choice.finish_reason

    if (finishReason === "stop") {
      return choice.message.content
    }

    if (finishReason === "tool_calls") {
      const toolCalls = choice.message.tool_calls
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