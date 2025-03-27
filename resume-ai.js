// AI Enhancement Module for CV Craft Pro
class ResumeAI {
    constructor(dataset) {
      // Load AI dataset
      this.dataset = dataset;
      this.initialized = false;
    }
    respondToQuery(query) {
        if (!this.initialized) return "AI not initialized. Please try again later.";
        const queryLower = query.toLowerCase().trim();

        // Skill suggestion
        if (queryLower.includes('skill') || queryLower.includes('suggest skill')) {
            const roleMatch = this.extractRole(queryLower);
            const role = roleMatch || 'Software Engineer';
            const skills = this.suggestSkills(role);
            return `Here are some suggested skills for a ${role}: ${skills.slice(0, 5).join(', ')}. Add these to showcase your expertise!`;
        }

        // Summary improvement
        if (queryLower.includes('summary') || queryLower.includes('improve my summary')) {
            const roleMatch = this.extractRole(queryLower) || 'Software Engineer';
            const userData = { role: roleMatch, skills: ['JavaScript', 'Python', 'React'] }; // Dummy skills for demo
            const sample = this.generateSummary(userData);
            return `To improve your summary, highlight your role, experience, and key skills in 3-4 sentences. Here's an example: "${sample}" Tailor it to your specific achievements!`;
        }

        // Achievement enhancement
        if (queryLower.includes('enhance') || queryLower.includes('improve') || queryLower.includes('make better')) {
            const achievementMatch = query.match(/["'](.+?)["']|enhance\s+(.+)$/i);
            const achievement = achievementMatch ? (achievementMatch[1] || achievementMatch[2]) : 'worked on projects';
            const enhanced = this.enhanceAchievement(achievement);
            return `Here's an enhanced version: "${enhanced}". Add metrics or specifics to make it stronger!`;
        }

        // General tips
        if (queryLower.includes('how') || queryLower.includes('tip') || queryLower.includes('advice')) {
            return "Focus on quantifiable achievements (e.g., 'increased sales by 20%'), use action verbs like 'Led' or 'Developed', and tailor your CV to the job. Need help with something specific? Ask me!";
        }

        // Default response
        return "I'm here to help with your CV! Try asking me to suggest skills, enhance an achievement, or improve your summary.";
    }

    // Extract role from query
    extractRole(query) {
        for (const title of this.dataset.professional_titles) {
            if (query.includes(title.role.toLowerCase())) return title.role;
            for (const enhanced of title.enhanced_titles) {
                if (query.includes(enhanced.toLowerCase())) return title.role;
            }
            for (const keyword of title.keywords) {
                if (query.includes(keyword.toLowerCase())) return title.role;
            }
        }
        for (const [role] of Object.entries(this.dataset.skill_recommendations)) {
            if (query.includes(role.toLowerCase())) return role;
        }
        return null;
    }
    // Initialize the AI system
    async initialize() {
      if (!this.dataset) {
        try {
          // Load dataset from file if not provided
          const response = await fetch('./asset/data/resume-ai-dataset.json');
          this.dataset = await response.json();
          this.initialized = true;
          console.log('Resume AI initialized successfully');
        } catch (error) {
          console.error('Failed to initialize Resume AI:', error);
          return false;
        }
      } else {
        this.initialized = true;
      }
      return true;
    }
  
    // Enhance professional title
    enhanceTitle(currentTitle) {
      if (!this.initialized) return currentTitle;
      
      // Find matching role
      const titleLower = currentTitle.toLowerCase();
      let bestMatch = null;
      let highestScore = 0;
      
      for (const role of this.dataset.professional_titles) {
        // Check for exact match
        if (role.role.toLowerCase() === titleLower) {
          bestMatch = role;
          break;
        }
        
        // Check for keyword matches
        let score = 0;
        for (const keyword of role.keywords) {
          if (titleLower.includes(keyword.toLowerCase())) {
            score++;
          }
        }
        
        if (score > highestScore) {
          highestScore = score;
          bestMatch = role;
        }
      }
      
      if (bestMatch && bestMatch.enhanced_titles.length > 0) {
        // Return random enhanced title from the matched role
        return bestMatch.enhanced_titles[
          Math.floor(Math.random() * bestMatch.enhanced_titles.length)
        ];
      }
      
      return currentTitle;
    }
  
    // Create professional summary
    generateSummary(userData) {
      if (!this.initialized) return '';
      
      // Determine role type
      let roleType = 'technical';
      const roleLower = (userData.role || '').toLowerCase();
      
      if (roleLower.includes('manager') || roleLower.includes('director') || 
          roleLower.includes('lead') || roleLower.includes('head')) {
        roleType = 'management';
      } else if (roleLower.includes('design') || roleLower.includes('writer') || 
                roleLower.includes('creative') || roleLower.includes('artist')) {
        roleType = 'creative';
      }
      
      // Find appropriate template
      const templates = this.dataset.summary_templates.find(t => t.role_type === roleType)?.templates || [];
      
      if (templates.length === 0) return '';
      
      // Select random template
      let template = templates[Math.floor(Math.random() * templates.length)];
      
      // Fill in template
      template = template.replace('{role}', userData.role || 'professional');
      template = template.replace('{years}', userData.experience || '5+');
      template = template.replace('{technical_domain}', userData.domain || userData.role || 'software development');
      template = template.replace('{industry}', userData.industry || 'technology');
      template = template.replace('{creative_domain}', userData.domain || 'design');
      template = template.replace('{creative_output}', roleType === 'creative' ? 'engaging content' : 'solutions');
      
      // Add skills
      const skills = userData.skills || ['problem-solving', 'communication', 'teamwork'];
      template = template.replace('{skill1}', skills[0] || 'problem-solving');
      template = template.replace('{skill2}', skills.length > 1 ? skills[1] : 'communication');
      template = template.replace('{skill3}', skills.length > 2 ? skills[2] : 'teamwork');
      
      // Add achievement
      template = template.replace('{achievement_type}', 'delivering high-quality solutions');
      template = template.replace('{achievement_result}', 'drive business growth and customer satisfaction');
      template = template.replace('{business_outcome}', 'improved efficiency and productivity');
      template = template.replace('{focus_area}', userData.focus || 'quality delivery');
      template = template.replace('{strength}', 'translating business requirements into technical solutions');
      template = template.replace('{value}', 'continuous learning and improvement');
      template = template.replace('{approach}', 'innovative thinking and attention to detail');
      template = template.replace('{business_area}', 'operations');
      
      return template;
    }
  
    // Enhance achievement descriptions
    enhanceAchievement(achievement) {
      if (!this.initialized || !achievement) return achievement;
      
      // Find similar achievement in dataset
      let bestMatch = null;
      let highestSimilarity = 0;
      
      for (const enhancer of this.dataset.achievement_enhancers) {
        const similarity = this.calculateSimilarity(
          achievement.toLowerCase(), 
          enhancer.original.toLowerCase()
        );
        
        if (similarity > highestSimilarity) {
          highestSimilarity = similarity;
          bestMatch = enhancer;
        }
      }
      
      // If similarity threshold met, return enhanced version
      if (bestMatch && highestSimilarity > 0.3) {
        return bestMatch.enhanced;
      }
      
      // Otherwise, try to add quantifiable improvements
      if (achievement.length < 100) {
        return this.addQuantifiableMetrics(achievement);
      }
      
      return achievement;
    }
    
    // Add metrics to an achievement
    addQuantifiableMetrics(achievement) {
      // Don't modify if already has numbers
      if (/\d+%|\d+\s+percent|\$\d+/.test(achievement)) {
        return achievement;
      }
      
      const metrics = [
        "resulting in a 30% increase in efficiency",
        "improving performance by 25%",
        "reducing costs by 20%",
        "increasing revenue by 15%",
        "saving the team 10 hours per week",
        "boosting customer satisfaction by 40%",
        "accelerating development time by 35%"
      ];
      
      const randomMetric = metrics[Math.floor(Math.random() * metrics.length)];
      return `${achievement}, ${randomMetric}`;
    }
  
    // Suggest skills based on job role
    suggestSkills(role) {
      if (!this.initialized) return [];
      
      // Find matching role or closest match
      const roleLower = role.toLowerCase();
      let bestMatch = null;
      
      for (const [key, value] of Object.entries(this.dataset.skill_recommendations)) {
        if (key.toLowerCase() === roleLower || roleLower.includes(key.toLowerCase())) {
          bestMatch = { role: key, skills: value };
          break;
        }
      }
      
      if (!bestMatch) {
        // Default to Software Engineer if no match found
        bestMatch = { 
          role: 'Software Engineer', 
          skills: this.dataset.skill_recommendations['Software Engineer'] 
        };
      }
      
      // Combine technical and soft skills
      const allSkills = [
        ...bestMatch.skills.technical,
        ...bestMatch.skills.soft
      ];
      
      // Return random selection of skills
      const shuffled = allSkills.sort(() => 0.5 - Math.random());
      return shuffled.slice(0, 10);
    }
    
    // Get powerful action verbs for bullet points
    getActionVerbs(category = 'all') {
      if (!this.initialized) return [];
      
      if (category !== 'all' && this.dataset.action_verbs[category]) {
        return this.dataset.action_verbs[category];
      }
      
      // Combine all categories
      const allVerbs = [];
      for (const verbs of Object.values(this.dataset.action_verbs)) {
        allVerbs.push(...verbs);
      }
      
      return allVerbs;
    }
    
    // Calculate simple text similarity
    calculateSimilarity(str1, str2) {
      const words1 = str1.toLowerCase().split(/\W+/);
      const words2 = str2.toLowerCase().split(/\W+/);
      
      let matches = 0;
      for (const word1 of words1) {
        if (word1.length < 3) continue; // Skip short words
        if (words2.includes(word1)) matches++;
      }
      
      return matches / Math.max(words1.length, words2.length);
    }
  }
  
  // Provide default dataset if file loading fails
  const DEFAULT_DATASET = {
    "professional_titles": [
      {
        "role": "Software Engineer",
        "enhanced_titles": [
          "Senior Software Engineer",
          "Full Stack Software Engineer",
          "Software Development Engineer",
          "Backend Software Engineer",
          "Frontend Software Engineer"
        ],
        "keywords": ["develop", "code", "software", "programming", "engineer"]
      },
      {
        "role": "Web Developer",
        "enhanced_titles": [
          "Full Stack Web Developer",
          "Frontend Web Developer",
          "Web Application Developer",
          "UI/UX Developer",
          "JavaScript Developer"
        ],
        "keywords": ["web", "frontend", "website", "javascript", "html"]
      },
      {
        "role": "Data Analyst",
        "enhanced_titles": [
          "Data Analytics Specialist",
          "Business Intelligence Analyst",
          "Data Insights Analyst",
          "Quantitative Analyst",
          "Business Data Analyst"
        ],
        "keywords": ["data", "analysis", "analytics", "insights", "reports"]
      }
    ],
    "summary_templates": [
      {
        "role_type": "technical",
        "templates": [
          "{years} years of experience in {technical_domain} with expertise in {skill1}, {skill2}, and {skill3}. Proven track record of delivering {achievement_type} that {achievement_result}. Passionate about {interest} and committed to {value}.",
          "Results-driven {role} with {years}+ years of experience specializing in {technical_domain}. Skilled in {skill1}, {skill2}, and {skill3}, with a strong focus on {focus_area}. Demonstrated success in {achievement_type} that {achievement_result}."
        ]
      },
      {
        "role_type": "management",
        "templates": [
          "Strategic {role} with {years} years of experience leading teams in {industry}. Expertise in {skill1}, {skill2}, and {skill3}. Proven ability to {achievement_type} that {achievement_result}. Committed to {value} while driving {business_outcome}.",
          "Results-oriented {role} with {years}+ years of experience in {industry}. Skilled in {skill1}, {skill2}, and {skill3}. Track record of {achievement_type} that {achievement_result} through effective {approach}."
        ]
      },
      {
        "role_type": "creative",
        "templates": [
          "Imaginative {role} with {years} years of experience creating {creative_output} for {industry}. Skilled in {skill1}, {skill2}, and {skill3}. Successfully {achievement_type} that {achievement_result} through {approach}.",
          "Creative {role} with expertise in developing {creative_output} that {achievement_result}. {years} years of experience in {industry}, with strengths in {skill1}, {skill2}, and {skill3}."
        ]
      }
    ],
    "achievement_enhancers": [
      {
        "original": "Developed a new website",
        "enhanced": "Designed and developed a responsive website that increased user engagement by 45% and reduced bounce rate by 30%"
      },
      {
        "original": "Improved database performance",
        "enhanced": "Optimized database queries and implemented caching strategies that reduced system latency by 60% and improved application response time by 45%"
      },
      {
        "original": "Led a team of developers",
        "enhanced": "Led a cross-functional team of 8 developers to deliver 5 critical projects on time and 15% under budget, resulting in $1.2M annual savings"
      }
    ],
    "skill_recommendations": {
      "Software Engineer": {
        "technical": ["JavaScript", "Python", "Java", "React", "Angular", "Node.js", "Git", "Docker", "RESTful APIs", "AWS"],
        "soft": ["Problem Solving", "Communication", "Teamwork", "Attention to Detail"]
      },
      "Data Scientist": {
        "technical": ["Python", "R", "SQL", "Machine Learning", "TensorFlow", "Data Visualization", "Tableau", "Statistical Analysis"],
        "soft": ["Analytical Thinking", "Problem Solving", "Communication", "Critical Thinking"]
      }
    },
    "action_verbs": {
      "leadership": ["Led", "Directed", "Managed", "Oversaw", "Supervised"],
      "development": ["Developed", "Created", "Designed", "Built", "Implemented"],
      "improvement": ["Improved", "Enhanced", "Optimized", "Streamlined", "Upgraded"]
    }
  };