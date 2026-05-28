import OpenAI from 'openai'
import { searchCodebase, getFile, listFiles, findReferences } from './tools.js'

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
  }
]

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
    default:
      throw new Error(`Unknown tool: ${toolName}`)
  }
}

const systemPrompt = `You are an expert code review assistant analyzing an uploaded codebase.
You have access to 4 tools to explore the codebase:
- search_codebase: semantically search for relevant code
- get_file: get full content of a specific file
- list_files: see all files in the project
- find_references: find where a function or variable is used

Rules:
- Always explore the codebase using tools before answering
- Never rewrite full files ,only point out issues and suggest fixes
- Always mention exact file paths and line numbers when possible
- If you find a bug or issue, explain why it is a problem and how to fix it
- Be specific and concise in your answers

And at end , give responses,suggestions or outputs keeping in mind , the user's query and overall 
complexity of the entire codebase.

`

const agentLoop = async (userQuestion, chatHistory=[]) => {
  const messages = [
    { role: "system", content: systemPrompt },
    ...chatHistory,
    { role: "user", content: userQuestion }
  ]

  const MAX_ITERATIONS = 4

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      tools,
      tool_choice: "auto",
      max_tokens: 1024,
    })

    const choice = response.choices[0]

    if (choice.finish_reason === "stop") {
      return choice.message.content
    }

   
    if (choice.finish_reason === "tool_calls") {
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
          content: JSON.stringify(toolResult)
        })
      }
      
    }
   
    else if (choice.finish_reason === "length") {
      return "My response was too long and got cut off. Please ask a more specific question."
    }

    else {
      return "An unexpected issue occurred. Please try again."
    }
  }

 
  return "I was unable to find a complete answer within the allowed steps. Please try rephrasing your question."
}

export { agentLoop }