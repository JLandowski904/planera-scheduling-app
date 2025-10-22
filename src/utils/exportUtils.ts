import { Project, Node, Edge } from '../types';

export interface ExportOptions {
  format: 'json' | 'csv' | 'excel';
  includeMetadata?: boolean;
  includeViewSettings?: boolean;
  includeFilters?: boolean;
  dateFormat?: 'iso' | 'readable';
}

export interface CSVRow {
  [key: string]: string | number | boolean;
}

/**
 * Export project to JSON format
 */
export const exportToJSON = (project: Project, options: ExportOptions = { format: 'json' }): string => {
  const exportData: any = {
    project: {
      id: project.id,
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    },
    nodes: project.nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        startDate: node.data.startDate?.toISOString(),
        dueDate: node.data.dueDate?.toISOString(),
      },
    })),
    edges: project.edges,
    phases: project.phases ?? [],
  };

  if (options.includeViewSettings) {
    exportData.viewSettings = project.viewSettings;
  }

  if (options.includeFilters) {
    exportData.filters = project.filters;
  }

  if (options.includeMetadata) {
    exportData.metadata = {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      nodeCount: project.nodes.length,
      edgeCount: project.edges.length,
    };
  }

  return JSON.stringify(exportData, null, 2);
};

/**
 * Export project to CSV format
 */
export const exportToCSV = (project: Project, options: ExportOptions = { format: 'csv' }): string => {
  const rows: CSVRow[] = [];

  // Add project metadata
  if (options.includeMetadata) {
    rows.push({
      'Project Name': project.name,
      'Project Description': project.description || '',
      'Created At': formatDate(project.createdAt, options.dateFormat),
      'Updated At': formatDate(project.updatedAt, options.dateFormat),
      'Node Count': project.nodes.length,
      'Edge Count': project.edges.length,
    });
    rows.push({}); // Empty row separator
  }

  // Add nodes data
  rows.push({
    'Type': 'NODES',
    'ID': '',
    'Title': '',
    'Node Type': '',
    'Status': '',
    'Priority': '',
    'Start Date': '',
    'Due Date': '',
    'Progress': '',
    'Discipline': '',
    'Assignees': '',
    'Tags': '',
    'Notes': '',
    'Position X': '',
    'Position Y': '',
    'Width': '',
    'Height': '',
  });

  project.nodes.forEach(node => {
    rows.push({
      'Type': 'NODE',
      'ID': node.id,
      'Title': node.title,
      'Node Type': node.type,
      'Status': node.data.status || '',
      'Priority': node.data.priority || '',
      'Start Date': formatDate(node.data.startDate, options.dateFormat),
      'Due Date': formatDate(node.data.dueDate, options.dateFormat),
      'Progress': node.data.percentComplete || 0,
      'Discipline': node.data.discipline || '',
      'Assignees': node.data.assignees?.join(', ') || '',
      'Tags': node.data.tags?.join(', ') || '',
      'Notes': node.data.notes || '',
      'Position X': node.position.x,
      'Position Y': node.position.y,
      'Width': node.width || 0,
      'Height': node.height || 0,
    });
  });

  // Add edges data
  rows.push({}); // Empty row separator
  rows.push({
    'Type': 'EDGES',
    'ID': '',
    'Source': '',
    'Target': '',
    'Dependency Type': '',
    'Label': '',
    'Is Blocked': '',
  });

  project.edges.forEach(edge => {
    rows.push({
      'Type': 'EDGE',
      'ID': edge.id,
      'Source': edge.source,
      'Target': edge.target,
      'Dependency Type': edge.type,
      'Label': edge.label || '',
      'Is Blocked': edge.isBlocked || false,
    });
  });

  // Convert to CSV string
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      headers.map(header => {
        const value = row[header];
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  return csvContent;
};

/**
 * Export project to Excel format (CSV with Excel-specific formatting)
 */
export const exportToExcel = (project: Project, options: ExportOptions = { format: 'excel' }): string => {
  // For now, return CSV format - in a real implementation, you'd use a library like xlsx
  return exportToCSV(project, { ...options, format: 'csv' });
};

/**
 * Import project from JSON
 */
export const importFromJSON = (jsonString: string): Project => {
  try {
    const data = JSON.parse(jsonString);
    
    // Validate required fields
    if (!data.project || !data.nodes || !data.edges) {
      throw new Error('Invalid project format: missing required fields');
    }

    // Convert date strings back to Date objects
    const nodes = data.nodes.map((node: any) => ({
      ...node,
      data: {
        ...node.data,
        startDate: node.data.startDate ? new Date(node.data.startDate) : undefined,
        dueDate: node.data.dueDate ? new Date(node.data.dueDate) : undefined,
      },
    }));

    const project: Project = {
      id: data.project.id || generateId(),
      name: data.project.name || 'Imported Project',
      description: data.project.description,
      createdAt: data.project.createdAt ? new Date(data.project.createdAt) : new Date(),
      updatedAt: new Date(),
      nodes,
      edges: data.edges,
      phases: data.phases || [],
      viewSettings: data.viewSettings || {
        currentView: 'whiteboard',
        zoom: 1,
        pan: { x: 0, y: 0 },
        snapToGrid: true,
        gridSize: 20,
        showGrid: true,
      },
      filters: data.filters || {
        types: [],
        statuses: [],
        assignees: [],
        disciplines: [],
        tags: [],
        blockedOnly: false,
        customPresets: [],
      },
    };

    return project;
  } catch (error) {
    throw new Error(`Failed to import project: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Import project from CSV
 */
export const importFromCSV = (csvString: string): Project => {
  try {
    const lines = csvString.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    let projectName = 'Imported Project';
    let projectDescription = '';

    let currentSection = '';
    let nodeIdMap = new Map<string, string>(); // Map old IDs to new IDs

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = parseCSVLine(line);
      const row: { [key: string]: string } = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      if (row['Type'] === 'NODES') {
        currentSection = 'nodes';
        continue;
      } else if (row['Type'] === 'EDGES') {
        currentSection = 'edges';
        continue;
      }

      if (currentSection === 'nodes' && row['Type'] === 'NODE') {
        const oldId = row['ID'];
        const newId = generateId();
        nodeIdMap.set(oldId, newId);

        const node: Node = {
          id: newId,
          type: row['Node Type'] as any,
          title: row['Title'],
          position: {
            x: parseFloat(row['Position X']) || 0,
            y: parseFloat(row['Position Y']) || 0,
          },
          width: parseFloat(row['Width']) || 120,
          height: parseFloat(row['Height']) || 60,
          data: {
            id: newId,
            title: row['Title'],
            type: row['Node Type'] as any,
            status: row['Status'] as any,
            priority: row['Priority'] as any,
            startDate: row['Start Date'] ? new Date(row['Start Date']) : undefined,
            dueDate: row['Due Date'] ? new Date(row['Due Date']) : undefined,
            percentComplete: parseFloat(row['Progress']) || 0,
            discipline: row['Discipline'],
            assignees: row['Assignees'] ? row['Assignees'].split(',').map(a => a.trim()) : [],
            tags: row['Tags'] ? row['Tags'].split(',').map(t => t.trim()) : [],
            notes: row['Notes'],
          },
        };

        nodes.push(node);
      } else if (currentSection === 'edges' && row['Type'] === 'EDGE') {
        const sourceId = nodeIdMap.get(row['Source']);
        const targetId = nodeIdMap.get(row['Target']);

        if (sourceId && targetId) {
          const edge: Edge = {
            id: generateId(),
            source: sourceId,
            target: targetId,
            type: row['Dependency Type'] as any,
            label: row['Label'],
            isBlocked: row['Is Blocked'] === 'true',
          };

          edges.push(edge);
        }
      } else if (row['Project Name']) {
        projectName = row['Project Name'];
        projectDescription = row['Project Description'];
      }
    }

    const project: Project = {
      id: generateId(),
      name: projectName,
      description: projectDescription,
      createdAt: new Date(),
      updatedAt: new Date(),
      nodes,
      edges,
      phases: [],
      viewSettings: {
        currentView: 'whiteboard',
        zoom: 1,
        pan: { x: 0, y: 0 },
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
        customPresets: [],
      },
    };

    return project;
  } catch (error) {
    throw new Error(`Failed to import CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Download file with given content and filename
 */
export const downloadFile = (content: string, filename: string, mimeType: string = 'text/plain') => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

/**
 * Export project with specified options
 */
export const exportProject = (project: Project, options: ExportOptions) => {
  const timestamp = new Date().toISOString().split('T')[0];
  const sanitizedName = project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  
  let content: string;
  let filename: string;
  let mimeType: string;

  switch (options.format) {
    case 'json':
      content = exportToJSON(project, options);
      filename = `${sanitizedName}_${timestamp}.json`;
      mimeType = 'application/json';
      break;
    case 'csv':
      content = exportToCSV(project, options);
      filename = `${sanitizedName}_${timestamp}.csv`;
      mimeType = 'text/csv';
      break;
    case 'excel':
      content = exportToExcel(project, options);
      filename = `${sanitizedName}_${timestamp}.csv`;
      mimeType = 'application/vnd.ms-excel';
      break;
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }

  downloadFile(content, filename, mimeType);
};

/**
 * Import project from file
 */
export const importProject = async (file: File): Promise<Project> => {
  const content = await file.text();
  const extension = file.name.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'json':
      return importFromJSON(content);
    case 'csv':
      return importFromCSV(content);
    default:
      throw new Error(`Unsupported file format: ${extension}`);
  }
};

// Helper functions
const formatDate = (date: Date | undefined, format?: string): string => {
  if (!date) return '';
  
  if (format === 'iso') {
    return date.toISOString();
  }
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const generateId = (): string => {
  return `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
};


