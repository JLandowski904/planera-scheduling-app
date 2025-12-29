import { ConstructionTemplate, ConstructionPhase, Project, Node } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { addDays } from 'date-fns';

export const constructionTemplates: ConstructionTemplate[] = [
  {
    id: 'residential-subdivision',
    name: 'Residential Subdivision',
    description: 'Complete subdivision development from planning to construction',
    phases: [
      {
        name: 'Programming & Planning',
        milestones: ['Project Kickoff', 'Programming Complete', 'Site Analysis Complete'],
        deliverables: ['Program Document', 'Site Analysis Report', 'Feasibility Study'],
        typicalDuration: 30
      },
      {
        name: 'Schematic Design',
        milestones: ['30% Design', '60% Design', '90% Design'],
        deliverables: ['Site Plan', 'Utility Plan', 'Stormwater Report', 'Preliminary Plat'],
        typicalDuration: 60
      },
      {
        name: 'Design Development',
        milestones: ['Design Development Complete', 'Agency Review Complete'],
        deliverables: ['Final Site Plan', 'Construction Documents', 'Permit Drawings'],
        typicalDuration: 45
      },
      {
        name: 'Permitting',
        milestones: ['Permit Application Submitted', 'Permit Issued'],
        deliverables: ['Permit Application', 'Approved Plans'],
        typicalDuration: 90
      },
      {
        name: 'Bidding & Award',
        milestones: ['Bid Package Released', 'Bids Received', 'Contract Awarded'],
        deliverables: ['Bid Documents', 'Bid Analysis', 'Construction Contract'],
        typicalDuration: 30
      },
      {
        name: 'Construction',
        milestones: ['Construction Start', 'Substantial Completion', 'Final Completion'],
        deliverables: ['Construction Progress Reports', 'As-Built Drawings', 'Warranty Documents'],
        typicalDuration: 180
      }
    ],
    defaultDisciplines: ['Civil', 'Architecture', 'Landscape', 'Survey', 'Geotechnical', 'Environmental'],
    defaultTags: ['RFI', 'Submittal', 'Permit', 'Review', 'Survey', 'Utility', 'Stormwater', 'Grading', 'Drainage']
  },
  {
    id: 'commercial-development',
    name: 'Commercial Development',
    description: 'Commercial building development project',
    phases: [
      {
        name: 'Pre-Design',
        milestones: ['Project Initiation', 'Site Selection', 'Due Diligence Complete'],
        deliverables: ['Site Selection Report', 'Due Diligence Report', 'Program Requirements'],
        typicalDuration: 45
      },
      {
        name: 'Schematic Design',
        milestones: ['Concept Design', 'Schematic Design Complete'],
        deliverables: ['Concept Plans', 'Schematic Drawings', 'Cost Estimate'],
        typicalDuration: 60
      },
      {
        name: 'Design Development',
        milestones: ['Design Development Complete', 'Code Review Complete'],
        deliverables: ['Design Development Drawings', 'Specifications', 'Code Analysis'],
        typicalDuration: 75
      },
      {
        name: 'Construction Documents',
        milestones: ['50% CD', '90% CD', '100% CD'],
        deliverables: ['Construction Drawings', 'Project Manual', 'Bid Documents'],
        typicalDuration: 90
      },
      {
        name: 'Permitting',
        milestones: ['Permit Application', 'Plan Review Complete', 'Permit Issued'],
        deliverables: ['Permit Application', 'Approved Plans', 'Building Permit'],
        typicalDuration: 60
      },
      {
        name: 'Construction',
        milestones: ['Construction Start', 'Substantial Completion', 'Certificate of Occupancy'],
        deliverables: ['Construction Progress', 'As-Built Drawings', 'Warranty Documents'],
        typicalDuration: 240
      }
    ],
    defaultDisciplines: ['Architecture', 'Civil', 'Structural', 'MEP', 'Landscape', 'Survey'],
    defaultTags: ['RFI', 'Submittal', 'Permit', 'Review', 'Code', 'Fire', 'Accessibility', 'Energy']
  },
  {
    id: 'infrastructure-project',
    name: 'Infrastructure Project',
    description: 'Road, utility, or infrastructure improvement project',
    phases: [
      {
        name: 'Planning & Design',
        milestones: ['Project Initiation', 'Preliminary Design', 'Final Design'],
        deliverables: ['Project Charter', 'Preliminary Plans', 'Final Plans'],
        typicalDuration: 120
      },
      {
        name: 'Environmental & Permitting',
        milestones: ['Environmental Review', 'Permit Applications', 'Permits Issued'],
        deliverables: ['Environmental Assessment', 'Permit Applications', 'Approved Permits'],
        typicalDuration: 90
      },
      {
        name: 'Right-of-Way',
        milestones: ['ROW Acquisition Start', 'ROW Acquisition Complete'],
        deliverables: ['ROW Plans', 'Acquisition Documents', 'Title Reports'],
        typicalDuration: 60
      },
      {
        name: 'Construction',
        milestones: ['Construction Start', 'Substantial Completion', 'Final Acceptance'],
        deliverables: ['Construction Progress', 'As-Built Plans', 'Final Documentation'],
        typicalDuration: 180
      }
    ],
    defaultDisciplines: ['Civil', 'Structural', 'Traffic', 'Environmental', 'Survey', 'Utility'],
    defaultTags: ['ROW', 'Environmental', 'Permit', 'Utility', 'Traffic', 'Construction', 'Inspection']
  }
];

export const createProjectFromTemplate = (
  templateId: string,
  projectName: string,
  startDate: Date = new Date()
): Project => {
  const template = constructionTemplates.find(t => t.id === templateId);
  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }

  const projectId = uuidv4();
  const nodes: Node[] = [];
  let currentDate = startDate;

  // Create nodes for each phase
  template.phases.forEach((phase, phaseIndex) => {
    // Create milestones
    phase.milestones.forEach((milestoneName, milestoneIndex) => {
      const milestoneDate = addDays(currentDate, (milestoneIndex + 1) * (phase.typicalDuration / phase.milestones.length));
      
      nodes.push({
        id: uuidv4(),
        type: 'milestone',
        title: milestoneName,
        position: { x: 200 + phaseIndex * 200, y: 50 + milestoneIndex * 100 },
        width: 80,
        height: 80,
        data: {
          id: uuidv4(),
          title: milestoneName,
          type: 'milestone',
          dueDate: milestoneDate,
          tags: ['Milestone', phase.name],
        },
      });
    });

    // Create deliverables
    phase.deliverables.forEach((deliverableName, deliverableIndex) => {
      const deliverableDate = addDays(currentDate, (deliverableIndex + 1) * (phase.typicalDuration / phase.deliverables.length));
      
      nodes.push({
        id: uuidv4(),
        type: 'deliverable',
        title: deliverableName,
        position: { x: 200 + phaseIndex * 200, y: 200 + deliverableIndex * 80 },
        width: 120,
        height: 60,
        data: {
          id: uuidv4(),
          title: deliverableName,
          type: 'deliverable',
          dueDate: deliverableDate,
          tags: ['Deliverable', phase.name],
        },
      });
    });

    // Create sample tasks for each phase
    const sampleTasks = getSampleTasksForPhase(phase.name, template.defaultDisciplines);
    sampleTasks.forEach((taskName, taskIndex) => {
      const taskStartDate = addDays(currentDate, taskIndex * 5);
      const taskDueDate = addDays(taskStartDate, 10);
      
      nodes.push({
        id: uuidv4(),
        type: 'task',
        title: taskName,
        position: { x: 200 + phaseIndex * 200, y: 350 + taskIndex * 100 },
        width: 140,
        height: 80,
        data: {
          id: uuidv4(),
          title: taskName,
          type: 'task',
          startDate: taskStartDate,
          dueDate: taskDueDate,
          status: 'not_started',
          priority: 'med',
          percentComplete: 0,
          tags: [phase.name, ...template.defaultTags.slice(0, 2)],
          discipline: getDisciplineForTask(taskName, template.defaultDisciplines),
        },
      });
    });

    currentDate = addDays(currentDate, phase.typicalDuration);
  });

  // Create people
  const people = createPeopleForTemplate(template);
  people.forEach((person, index) => {
    nodes.push({
      id: uuidv4(),
      type: 'person',
      title: person.name,
      position: { x: 50, y: 50 + index * 80 },
      width: 60,
      height: 60,
      data: {
        id: uuidv4(),
        title: person.name,
        type: 'person',
        initials: person.initials,
        tags: ['Person', person.role],
      },
    });
  });

  return {
    id: projectId,
    name: projectName,
    description: template.description,
    createdAt: new Date(),
    updatedAt: new Date(),
    nodes,
    edges: [], // No edges in template - user will create dependencies
    phases: [],
    assignees: [], // Initialize empty assignees list
    viewSettings: {
      currentView: 'whiteboard',
      zoom: 0.8,
      pan: { x: -100, y: -50 },
      snapToGrid: true,
      gridSize: 20,
      showGrid: true,
    },
    filters: {
      types: [],
      statuses: [],
      assignees: [],
      disciplines: [],
      tags: [],
      phases: [],
      blockedOnly: false,
      customPresets: [
        {
          id: 'current-phase',
          name: 'Current Phase',
          filters: { tags: ['Programming & Planning'] },
        },
        {
          id: 'permitting',
          name: 'Permitting',
          filters: { tags: ['Permit', 'Review'] },
        },
        {
          id: 'construction',
          name: 'Construction',
          filters: { tags: ['Construction'] },
        },
      ],
    },
  };
};

const getSampleTasksForPhase = (phaseName: string, disciplines: string[]): string[] => {
  const taskMap: { [key: string]: string[] } = {
    'Programming & Planning': [
      'Site Survey',
      'Geotechnical Investigation',
      'Environmental Assessment',
      'Utility Coordination',
      'Traffic Impact Study',
      'Cost Analysis'
    ],
    'Schematic Design': [
      'Site Layout Design',
      'Utility Design',
      'Stormwater Design',
      'Grading Plan',
      'Access Design',
      'Landscape Design'
    ],
    'Design Development': [
      'Detailed Design',
      'Specification Writing',
      'Code Analysis',
      'Cost Estimation',
      'Value Engineering',
      'Design Review'
    ],
    'Construction Documents': [
      'Construction Drawings',
      'Project Manual',
      'Bid Documents',
      'Specifications',
      'Details',
      'Schedules'
    ],
    'Permitting': [
      'Permit Application',
      'Plan Review',
      'Agency Coordination',
      'Permit Revisions',
      'Permit Issuance',
      'Permit Compliance'
    ],
    'Construction': [
      'Mobilization',
      'Site Preparation',
      'Utility Installation',
      'Grading',
      'Paving',
      'Final Inspection'
    ],
    'Pre-Design': [
      'Site Analysis',
      'Program Development',
      'Code Research',
      'Feasibility Study',
      'Budget Development',
      'Schedule Development'
    ],
    'Environmental & Permitting': [
      'Environmental Assessment',
      'Permit Applications',
      'Agency Coordination',
      'Public Hearings',
      'Permit Processing',
      'Compliance Monitoring'
    ],
    'Right-of-Way': [
      'ROW Survey',
      'Title Research',
      'Acquisition Negotiations',
      'Eminent Domain',
      'Title Transfer',
      'ROW Documentation'
    ]
  };

  return taskMap[phaseName] || ['Task 1', 'Task 2', 'Task 3'];
};

const getDisciplineForTask = (taskName: string, disciplines: string[]): string => {
  const taskDisciplineMap: { [key: string]: string } = {
    'Site Survey': 'Survey',
    'Geotechnical Investigation': 'Geotechnical',
    'Environmental Assessment': 'Environmental',
    'Utility Coordination': 'Civil',
    'Traffic Impact Study': 'Traffic',
    'Site Layout Design': 'Civil',
    'Utility Design': 'Civil',
    'Stormwater Design': 'Civil',
    'Grading Plan': 'Civil',
    'Access Design': 'Civil',
    'Landscape Design': 'Landscape',
    'Construction Drawings': 'Architecture',
    'Specifications': 'Architecture',
    'MEP Design': 'MEP',
    'Structural Design': 'Structural',
  };

  return taskDisciplineMap[taskName] || disciplines[0] || 'Civil';
};

const createPeopleForTemplate = (template: ConstructionTemplate) => {
  const people = [
    { name: 'Project Manager', initials: 'PM', role: 'Management' },
    { name: 'Civil Engineer', initials: 'CE', role: 'Civil' },
    { name: 'Architect', initials: 'AR', role: 'Architecture' },
  ];

  // Add discipline-specific people
  if (template.defaultDisciplines.includes('Structural')) {
    people.push({ name: 'Structural Engineer', initials: 'SE', role: 'Structural' });
  }
  if (template.defaultDisciplines.includes('MEP')) {
    people.push({ name: 'MEP Engineer', initials: 'ME', role: 'MEP' });
  }
  if (template.defaultDisciplines.includes('Landscape')) {
    people.push({ name: 'Landscape Architect', initials: 'LA', role: 'Landscape' });
  }
  if (template.defaultDisciplines.includes('Survey')) {
    people.push({ name: 'Surveyor', initials: 'SV', role: 'Survey' });
  }
  if (template.defaultDisciplines.includes('Environmental')) {
    people.push({ name: 'Environmental Engineer', initials: 'EE', role: 'Environmental' });
  }

  return people;
};

export const getTemplateById = (templateId: string): ConstructionTemplate | undefined => {
  return constructionTemplates.find(template => template.id === templateId);
};

export const getAllTemplates = (): ConstructionTemplate[] => {
  return constructionTemplates;
};


