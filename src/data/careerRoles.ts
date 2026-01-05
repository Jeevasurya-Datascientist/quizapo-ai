import { CareerRole } from '../types';

export const CAREER_ROLES: CareerRole[] = [
    // --- ENGINEERING ---
    {
        id: 'frontend-engineer',
        title: 'Frontend Engineer',
        category: 'Engineering',
        description: 'Builds the user interface of web applications using modern frameworks like React, Vue, or Angular. Focuses on performance, responsiveness, and user experience.',
        averageSalary: '$80,000 - $140,000',
        demandLevel: 'high',
        requiredSkills: [
            { name: 'JavaScript/TypeScript', level: 90 },
            { name: 'React/Vue', level: 85 },
            { name: 'CSS/Tailwind', level: 80 },
            { name: 'State Management', level: 75 },
            { name: 'Web Performance', level: 70 }
        ],
        learningPath: [
            'Learn HTML, CSS, and JavaScript fundamentals.',
            'Master a modern framework (React, Vue, or Angular).',
            'Understand build tools (Vite, Webpack) and Version Control (Git).',
            'Dive into State Management (Redux, Context API).',
            'Learn Testing (Jest, React Testing Library) and Accessibility.'
        ]
    },
    {
        id: 'backend-engineer',
        title: 'Backend Engineer',
        category: 'Engineering',
        description: 'Develops server-side logic, databases, and APIs. Ensures application scalability, security, and performance.',
        averageSalary: '$90,000 - $150,000',
        demandLevel: 'high',
        requiredSkills: [
            { name: 'Node.js/Python/Go', level: 90 },
            { name: 'SQL/NoSQL Databases', level: 85 },
            { name: 'API Design (REST/GraphQL)', level: 85 },
            { name: 'System Design', level: 75 },
            { name: 'Docker/Containerization', level: 70 }
        ],
        learningPath: [
            'Choose a server-side language (Node.js, Python, Java).',
            'Learn Database design and management (SQL vs NoSQL).',
            'Master API development (RESTful services, authentication).',
            'Understand caching (Redis) and message queues (Kafka, RabbitMQ).',
            'Learn basic DevOps (CI/CD, Docker).'
        ]
    },
    {
        id: 'fullstack-engineer',
        title: 'Full Stack Engineer',
        category: 'Engineering',
        description: 'Versatile developer capable of handling both client-side and server-side development. Bridges the gap between UI and backend logic.',
        averageSalary: '$95,000 - $160,000',
        demandLevel: 'high',
        requiredSkills: [
            { name: 'JavaScript/TypeScript', level: 90 },
            { name: 'React/Frontend', level: 80 },
            { name: 'Node/Backend', level: 80 },
            { name: 'Databases', level: 75 },
            { name: 'DevOps Basics', level: 60 }
        ],
        learningPath: [
            'Master the MERN stack (MongoDB, Express, React, Node) or similar.',
            'Build end-to-end applications with authentication.',
            'Understand deployment (Vercel, AWS, Heroku).',
            'Learn System Design principles.',
            'Optimize for both frontend performance and backend scalability.'
        ]
    },
    {
        id: 'mobile-dev-ios',
        title: 'iOS Developer',
        category: 'Engineering',
        description: 'Specializes in building applications for Apple devices using Swift and SwiftUI.',
        averageSalary: '$90,000 - $150,000',
        demandLevel: 'medium',
        requiredSkills: [
            { name: 'Swift', level: 90 },
            { name: 'SwiftUI', level: 85 },
            { name: 'iOS SDK', level: 80 },
            { name: 'Core Data', level: 70 },
            { name: 'App Store Guidelines', level: 60 }
        ],
        learningPath: [
            'Learn Swift programming language.',
            'Master Xcode and Interface Builder/SwiftUI.',
            'Understand iOS application lifecycle.',
            'Integrate with REST APIs and local storage.',
            'Publish an app to the App Store.'
        ]
    },
    {
        id: 'mobile-dev-android',
        title: 'Android Developer',
        category: 'Engineering',
        description: 'Builds applications for the Android ecosystem using Kotlin or Java.',
        averageSalary: '$85,000 - $145,000',
        demandLevel: 'medium',
        requiredSkills: [
            { name: 'Kotlin', level: 90 },
            { name: 'Jetpack Compose', level: 80 },
            { name: 'Android SDK', level: 85 },
            { name: 'Gradle', level: 70 },
            { name: 'Material Design', level: 65 }
        ],
        learningPath: [
            'Learn Kotlin (preferred over Java).',
            'Master Android Studio and Gradle.',
            'Understand Android Architecture Components (ViewModel, LiveData).',
            'Learn Jetpack Compose for UI.',
            'Handle background processing and networking.'
        ]
    },
    {
        id: 'devops-engineer',
        title: 'DevOps Engineer',
        category: 'Infrastructure',
        description: 'Focuses on automating deployment pipelines, managing infrastructure as code, and ensuring system reliability.',
        averageSalary: '$100,000 - $160,000',
        demandLevel: 'high',
        requiredSkills: [
            { name: 'CI/CD (Jenkins/GitHub Actions)', level: 90 },
            { name: 'Docker & Kubernetes', level: 85 },
            { name: 'AWS/Azure/GCP', level: 85 },
            { name: 'Terraform/Ansible', level: 80 },
            { name: 'Linux/Scripting', level: 85 }
        ],
        learningPath: [
            'Master Linux command line and Bash scripting.',
            'Learn a cloud provider (AWS is most popular).',
            'Understand Containerization (Docker) and Orchestration (Kubernetes).',
            'Implement CI/CD pipelines.',
            'Learn "Infrastructure as Code" (Terraform).'
        ]
    },
    // --- DATA ---
    {
        id: 'data-scientist',
        title: 'Data Scientist',
        category: 'Data & AI',
        description: 'Analyzes complex data sets to extract insights and build predictive models using statistical methods and machine learning.',
        averageSalary: '$100,000 - $170,000',
        demandLevel: 'high',
        requiredSkills: [
            { name: 'Python/R', level: 90 },
            { name: 'SQL', level: 85 },
            { name: 'Machine Learning', level: 85 },
            { name: 'Statistics', level: 80 },
            { name: 'Data Visualization', level: 75 }
        ],
        learningPath: [
            'Master Python and libraries (Pandas, NumPy).',
            'Learn Statistics and Probability.',
            'Understand SQL for data extraction.',
            'Dive into Machine Learning algorithms (Scikit-Learn).',
            'Learn Deep Learning frameworks (TensorFlow, PyTorch).'
        ]
    },
    {
        id: 'data-engineer',
        title: 'Data Engineer',
        category: 'Data & AI',
        description: 'Builds and maintains independent data pipelines. Ensures data availability and quality for analysts and data scientists.',
        averageSalary: '$100,000 - $165,000',
        demandLevel: 'high',
        requiredSkills: [
            { name: 'SQL/NoSQL', level: 95 },
            { name: 'Python/Scala', level: 90 },
            { name: 'Big Data (Spark/Hadoop)', level: 80 },
            { name: 'ETL Pipelines', level: 85 },
            { name: 'Cloud Data Warehouses', level: 80 }
        ],
        learningPath: [
            'Master SQL and Python scripting.',
            'Learn about Data Warehousing concepts.',
            'Work with Big Data tools (Apache Spark).',
            'Understand Orchestration tools (Airflow).',
            'Build ETL pipelines on cloud platforms.'
        ]
    },
    {
        id: 'ai-engineer',
        title: 'AI/ML Engineer',
        category: 'Data & AI',
        description: 'Designs and deploys artificial intelligence models into production systems. Bridges data science and software engineering.',
        averageSalary: '$120,000 - $200,000',
        demandLevel: 'high',
        requiredSkills: [
            { name: 'Python', level: 95 },
            { name: 'TensorFlow/PyTorch', level: 90 },
            { name: 'ML Ops', level: 80 },
            { name: 'API Development', level: 75 },
            { name: 'Cloud AI Services', level: 70 }
        ],
        learningPath: [
            'Strong foundation in Software Engineering.',
            'Deep understanding of ML algorithms and Deep Learning.',
            'Learn to deploy models (FastAPI, Flask, Docker).',
            'Understand MLOps (tracking experiments, model versioning).',
            'Work with LLMs and Generative AI.'
        ]
    },
    // --- PRODUCT & DESIGN ---
    {
        id: 'product-manager',
        title: 'Product Manager',
        category: 'Product',
        description: 'Defines product vision, strategy, and roadmap. Collaborates with engineering, design, and marketing to deliver value to users.',
        averageSalary: '$100,000 - $180,000',
        demandLevel: 'medium',
        requiredSkills: [
            { name: 'Strategic Thinking', level: 90 },
            { name: 'Communication', level: 95 },
            { name: 'Data Analysis', level: 75 },
            { name: 'User Empathy', level: 85 },
            { name: 'Agile Methodology', level: 80 }
        ],
        learningPath: [
            'Understand the Product Development Lifecycle.',
            'Learn to conduct User Research and Market Analysis.',
            'Master Agile/Scrum frameworks.',
            'Develop data-driven decision-making skills.',
            'Build a portfolio of product case studies.'
        ]
    },
    {
        id: 'ui-ux-designer',
        title: 'UI/UX Designer',
        category: 'Design',
        description: 'Designs intuitive and aesthetically pleasing user interfaces. Focuses on user journey, wireframing, and prototyping.',
        averageSalary: '$75,000 - $130,000',
        demandLevel: 'medium',
        requiredSkills: [
            { name: 'Figma/Sketch', level: 95 },
            { name: 'Visual Design', level: 90 },
            { name: 'User Research', level: 80 },
            { name: 'Prototyping', level: 85 },
            { name: 'HTML/CSS Basics', level: 50 }
        ],
        learningPath: [
            'Learn Design Principles (Typography, Color, Layout).',
            'Master design tools like Figma.',
            'Understand User Research methods.',
            'Learn Interaction Design and Prototyping.',
            'Build a design portfolio.'
        ]
    },
    // --- SECURITY ---
    {
        id: 'cybersecurity-analyst',
        title: 'Cybersecurity Analyst',
        category: 'Security',
        description: 'Protects an organization\'s computer systems and networks from threats. Monitors for security breaches and investigates incidents.',
        averageSalary: '$85,000 - $140,000',
        demandLevel: 'high',
        requiredSkills: [
            { name: 'Network Security', level: 90 },
            { name: 'Linux/OS Internals', level: 85 },
            { name: 'Risk Assessment', level: 80 },
            { name: 'Incident Response', level: 85 },
            { name: 'Scripting (Python/Bash)', level: 70 }
        ],
        learningPath: [
            'Learn Networking fundamentals (TCP/IP, OSI).',
            'Understand Operating Systems (Linux/Windows) deeply.',
            'Learn about common vulnerabilities (OWASP Top 10).',
            'Master security tools (Wireshark, Metasploit, SIEM).',
            'Obtain certifications (CompTIA Security+, CEH).',
        ]
    },
    {
        id: 'cloud-architect',
        title: 'Cloud Architect',
        category: 'Infrastructure',
        description: 'Designs and manages cloud computing strategies. Ensures cloud environments are scalable, reliable, and secure.',
        averageSalary: '$130,000 - $190,000',
        demandLevel: 'medium',
        requiredSkills: [
            { name: 'AWS/Azure/GCP Architecture', level: 95 },
            { name: 'System Design', level: 90 },
            { name: 'Networking', level: 85 },
            { name: 'Security Compliance', level: 80 },
            { name: 'Cost Optimization', level: 75 }
        ],
        learningPath: [
            'Gain deep experience with at least one major cloud provider.',
            'Learn advanced networking and security patterns.',
            'Master "Well-Architected Frameworks".',
            'Understand hybrid and multi-cloud strategies.',
            'Obtain Associate and Professional level certifications.'
        ]
    },
    {
        id: 'game-developer',
        title: 'Game Developer',
        category: 'Engineering',
        description: 'Creates video games for computers, mobile devices, or consoles. Involves graphics programming, physics, and gameplay logic.',
        averageSalary: '$70,000 - $120,000',
        demandLevel: 'medium',
        requiredSkills: [
            { name: 'C++/C#', level: 90 },
            { name: 'Unity/Unreal Engine', level: 90 },
            { name: '3D Math/Linear Algebra', level: 80 },
            { name: 'Graphics Programming', level: 70 },
            { name: 'Game Physics', level: 75 }
        ],
        learningPath: [
            'Learn C++ or C#.',
            'Master a Game Engine (Unity is great for beginners).',
            'Understand 3D Math and Physics.',
            'Learn about Game Design principles.',
            'Build and publish small games.'
        ]
    },
    {
        id: 'blockchain-dev',
        title: 'Blockchain Developer',
        category: 'Engineering',
        description: 'Develops decentralized applications (dApps) and smart contracts using blockchain technology.',
        averageSalary: '$100,000 - $180,000',
        demandLevel: 'medium',
        requiredSkills: [
            { name: 'Solidity/Rust', level: 90 },
            { name: 'Cryptography', level: 85 },
            { name: 'Smart Contracts', level: 90 },
            { name: 'Web3.js/Ethers.js', level: 80 },
            { name: 'Consensus Algorithms', level: 70 }
        ],
        learningPath: [
            'Understand how Blockchains work (Bitcoin, Ethereum).',
            'Learn Solidity for Ethereum Smart Contracts.',
            'Master Web3 integration with frontend.',
            'Understand DeFi and NFT standards.',
            'Learn about security vulnerabilities in Smart Contracts.'
        ]
    }
];
