const Task = require('../models/Task');
const Project = require('../models/Project');

// Helper to call Gemini API if key is available
const callGemini = async (apiKey, prompt, fallbackFn) => {
  if (!apiKey) {
    return fallbackFn();
  }
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });
    
    if (!response.ok) {
      console.warn('Gemini API call failed, falling back to local engine');
      return fallbackFn();
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!resultText) {
      return fallbackFn();
    }
    return resultText;
  } catch (error) {
    console.error('Error calling Gemini:', error.message);
    return fallbackFn();
  }
};

// 1. AI Task Prioritization Suggestion
const prioritizeTask = async (req, res) => {
  const { title, description } = req.body;
  const apiKey = req.headers['x-gemini-key'] || process.env.GEMINI_API_KEY;

  if (!title) {
    return res.status(400).json({ message: 'Task title is required' });
  }

  const prompt = `You are an AI project manager. Classify the priority of a task based on its title and description.
Task Title: "${title}"
Task Description: "${description || ''}"

Return ONLY a single word string, which must be one of: "low", "medium", "high", or "critical". No markdown, no punctuation.`;

  const fallback = () => {
    // Local NLP heuristics
    const text = (title + ' ' + (description || '')).toLowerCase();
    
    if (
      text.includes('crash') || 
      text.includes('broken') || 
      text.includes('security') || 
      text.includes('vulnerability') || 
      text.includes('hotfix') || 
      text.includes('production down') || 
      text.includes('cannot login')
    ) {
      return 'critical';
    }
    
    if (
      text.includes('bug') || 
      text.includes('error') || 
      text.includes('fail') || 
      text.includes('missing') || 
      text.includes('deploy') || 
      text.includes('database connection') ||
      text.includes('payment')
    ) {
      return 'high';
    }
    
    if (
      text.includes('ui') || 
      text.includes('style') || 
      text.includes('page') || 
      text.includes('dashboard') || 
      text.includes('add') || 
      text.includes('create') || 
      text.includes('refactor')
    ) {
      return 'medium';
    }
    
    return 'low';
  };

  try {
    const prioritySuggestion = await callGemini(apiKey, prompt, fallback);
    const cleanedResult = prioritySuggestion.trim().toLowerCase();
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    
    res.json({
      priority: validPriorities.includes(cleanedResult) ? cleanedResult : 'medium'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. AI Sprint Planning Task Generation
const generateSprintPlan = async (req, res) => {
  const { projectName, projectDescription } = req.body;
  const apiKey = req.headers['x-gemini-key'] || process.env.GEMINI_API_KEY;

  if (!projectName || !projectDescription) {
    return res.status(400).json({ message: 'Project Name and Description are required' });
  }

  const prompt = `You are an AI Scrum Master. Generate a sprint plan (a JSON array of tasks) for a project named "${projectName}" with description: "${projectDescription}".
Each task object in the JSON array must have these fields:
- "title": A short task title
- "description": Clear task requirement description
- "priority": one of "low", "medium", "high", "critical"
- "status": one of "backlog", "todo"
- "durationDays": estimated days to complete (number)

Return ONLY a valid JSON array of tasks. Do not include markdown code block syntax (like \`\`\`json).`;

  const fallback = () => {
    // Generate intelligent static tasks based on name/description keywords
    const desc = projectDescription.toLowerCase();
    let tasks = [];
    
    tasks.push({
      title: 'Setup Core Server & Database Config',
      description: 'Initialize backend codebase, setup server routing, connect MongoDB database, and establish error handling middleware.',
      priority: 'high',
      status: 'todo',
      durationDays: 2
    });
    
    tasks.push({
      title: 'User Registration & JWT Login APIs',
      description: 'Develop secure sign up and login endpoints using password hashing (bcrypt) and JSON Web Tokens for authentication.',
      priority: 'critical',
      status: 'todo',
      durationDays: 3
    });

    if (desc.includes('ecommerce') || desc.includes('shop') || desc.includes('cart') || desc.includes('store')) {
      tasks.push({
        title: 'Product Schema & Catalog API',
        description: 'Design the database models for products, create list/search APIs, and build front-end catalog grid pages.',
        priority: 'high',
        status: 'backlog',
        durationDays: 3
      });
      tasks.push({
        title: 'Shopping Cart & Checkout Workflow',
        description: 'Implement shopping cart state (Redux) and checkout endpoints to calculate totals, taxes, and shipping.',
        priority: 'high',
        status: 'backlog',
        durationDays: 4
      });
      tasks.push({
        title: 'Stripe Payment Gateway Integration',
        description: 'Configure payment processor webhook handlers, trigger secure checkouts, and generate order invoices.',
        priority: 'critical',
        status: 'backlog',
        durationDays: 4
      });
    } else if (desc.includes('chat') || desc.includes('social') || desc.includes('connect')) {
      tasks.push({
        title: 'Real-time WebSocket Connection Setup',
        description: 'Setup Socket.io rooms, handle client connections, and configure message emitters for instant message delivery.',
        priority: 'high',
        status: 'backlog',
        durationDays: 3
      });
      tasks.push({
        title: 'Chat UI & Active Users Indicator',
        description: 'Build a responsive chat window layout with sidebar displaying active users, typing bubbles, and offline states.',
        priority: 'medium',
        status: 'backlog',
        durationDays: 3
      });
    } else {
      tasks.push({
        title: 'Dashboard Statistics UI & Layout',
        description: 'Develop the main application shell, sidebars, routing guards, and statistics cards displaying summary data.',
        priority: 'medium',
        status: 'todo',
        durationDays: 3
      });
      tasks.push({
        title: 'Interactive Progress Charts Integration',
        description: 'Embed Recharts bar, line, and pie visualizations to summarize project completion rates and team efforts.',
        priority: 'medium',
        status: 'backlog',
        durationDays: 2
      });
    }

    tasks.push({
      title: 'Write Unit Tests & QA Validation',
      description: 'Ensure backend API endpoints work as intended and run local regression tests prior to staging deployments.',
      priority: 'low',
      status: 'backlog',
      durationDays: 2
    });

    return JSON.stringify(tasks);
  };

  try {
    const rawResult = await callGemini(apiKey, prompt, fallback);
    let parsedTasks;
    try {
      // Strip markdown code block wrappers if Gemini ignored instructions
      let cleaned = rawResult.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(json)?/, '').replace(/```$/, '').trim();
      }
      parsedTasks = JSON.parse(cleaned);
    } catch (e) {
      console.warn('Failed to parse Gemini response as JSON, using local generator instead');
      parsedTasks = JSON.parse(fallback());
    }
    
    res.json(parsedTasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. AI Risk Detection (Identify Delayed/Risky Tasks)
const detectProjectRisks = async (req, res) => {
  const { projectId } = req.params;

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const tasks = await Task.find({ projectId });
    const now = new Date();
    const risks = [];

    for (const task of tasks) {
      if (task.status === 'done') continue;

      const dueDate = new Date(task.dueDate);
      const isOverdue = dueDate < now;
      const daysUntilDue = (dueDate - now) / (1000 * 60 * 60 * 24);

      if (isOverdue) {
        risks.push({
          taskId: task._id,
          title: task.title,
          status: task.status,
          dueDate: task.dueDate,
          riskLevel: 'critical',
          reason: `Task is OVERDUE by ${Math.ceil(Math.abs(daysUntilDue))} day(s).`
        });
      } else if (daysUntilDue <= 2 && (task.status === 'todo' || task.status === 'backlog')) {
        risks.push({
          taskId: task._id,
          title: task.title,
          status: task.status,
          dueDate: task.dueDate,
          riskLevel: 'high',
          reason: `Due in ${Math.ceil(daysUntilDue)} day(s) but work has not started (Status: ${task.status}).`
        });
      } else if (daysUntilDue <= 4 && task.status === 'in_progress' && task.priority === 'critical') {
        risks.push({
          taskId: task._id,
          title: task.title,
          status: task.status,
          dueDate: task.dueDate,
          riskLevel: 'medium',
          reason: `Critical task due soon (${Math.ceil(daysUntilDue)} days) and currently In Progress.`
        });
      }
    }

    res.json({
      projectRiskFactor: risks.length === 0 ? 'Low' : risks.length <= 2 ? 'Medium' : 'High',
      riskyTasksCount: risks.length,
      risks
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. AI Project Weekly Summary Report
const generateProjectSummary = async (req, res) => {
  const { projectId } = req.params;
  const apiKey = req.headers['x-gemini-key'] || process.env.GEMINI_API_KEY;

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const tasks = await Task.find({ projectId }).populate('assignedTo', 'name');
    
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'done').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const testing = tasks.filter(t => t.status === 'testing').length;
    const todo = tasks.filter(t => t.status === 'todo').length;
    const backlog = tasks.filter(t => t.status === 'backlog').length;

    const overdueCount = tasks.filter(t => t.status !== 'done' && new Date(t.dueDate) < new Date()).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const prompt = `You are an AI Project Manager. Summarize the health of this project.
Project Name: "${project.name}"
Project Description: "${project.description || ''}"
Metrics:
- Total Tasks: ${total}
- Completed Tasks: ${completed} (${completionRate}% Completion Rate)
- Tasks In Progress: ${inProgress}
- Tasks In QA/Testing: ${testing}
- Overdue Tasks: ${overdueCount}

Please write a professional, well-formatted markdown report including:
1. Executive Summary: Short overview of project health.
2. Major Accomplishments: Summarize completed status.
3. Identified Bottlenecks: Highlight issues like overdue tasks.
4. Recommendations: Next steps for the team.

Ensure it uses clean markdown. Do not include markdown code block syntax (like \`\`\`markdown).`;

    const fallback = () => {
      return `### Project Summary: ${project.name}

#### 1. Executive Summary
The project **${project.name}** has a completion rate of **${completionRate}%** with **${completed} out of ${total}** tasks resolved. Overall project velocity is ${completionRate > 60 ? 'Healthy' : 'Moderate'}, but attention is required on pending tickets.

#### 2. Status Breakdown
* **Completed:** ${completed} task(s)
* **Active (In Progress & Testing):** ${inProgress + testing} task(s)
* **Planning (To Do & Backlog):** ${todo + backlog} task(s)
* **Overdue Items:** ${overdueCount} task(s)

#### 3. Bottlenecks & Risks
${overdueCount > 0 
  ? `* **Overdue Tasks Warning:** There are currently ${overdueCount} overdue task(s) requiring immediate updates from assignees.`
  : `* **No Major Overdue Risks:** All active tasks are currently within their target schedule window.`}
* **Distribution:** Tasks in backlog (${backlog}) should be groomed and assigned to balance workload.

#### 4. Action Items & Recommendations
1. Focus on clearing out the **${testing} task(s)** currently in Testing/QA to increase velocity.
2. Review due dates for the **${overdueCount} overdue task(s)** and reassign resources if needed.
3. Conduct a team sync to groom the **${backlog} backlog item(s)** and pull them into active sprints.`;
    };

    const summaryReport = await callGemini(apiKey, prompt, fallback);
    res.json({
      summaryText: summaryReport
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  prioritizeTask,
  generateSprintPlan,
  detectProjectRisks,
  generateProjectSummary
};
