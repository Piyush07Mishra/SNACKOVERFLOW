// Utility functions for salary calculations

export interface SalaryComponent {
  name: string;
  computationType: 'Fixed' | 'Percentage';
  value: number;
  calculatedValue: number;
  basisComponent?: string;
}

export interface SalaryConfigData {
  pfRate: number;
  professionalTax: number;
}

/**
 * Calculate salary components based on wage and component configuration
 */
export function calculateSalaryComponents(
  components: SalaryComponent[],
  wage: number,
  componentMap: Map<string, SalaryComponent> = new Map()
): SalaryComponent[] {
  // Build component map for reference (e.g., Basic for HRA calculation)
  const compMap = new Map(componentMap);
  
  return components.map((component) => {
    let calculatedValue = 0;

    if (component.computationType === 'Fixed') {
      calculatedValue = component.value;
    } else if (component.computationType === 'Percentage') {
      if (component.basisComponent && compMap.has(component.basisComponent)) {
        // Percentage of another component (e.g., HRA = 50% of Basic)
        const basisComponent = compMap.get(component.basisComponent);
        calculatedValue = (component.value / 100) * (basisComponent?.calculatedValue || 0);
      } else {
        // Percentage of wage
        calculatedValue = (component.value / 100) * wage;
      }
    }

    // Add to map for future references
    compMap.set(component.name, { ...component, calculatedValue });

    return {
      ...component,
      calculatedValue: Math.round(calculatedValue * 100) / 100,
    };
  });
}

/**
 * Get total earnings from all components
 */
export function getTotalEarnings(components: SalaryComponent[]): number {
  return components.reduce((sum, comp) => sum + comp.calculatedValue, 0);
}

/**
 * Get total deductions (PF + Professional Tax)
 */
export function getTotalDeductions(totalEarnings: number, config: SalaryConfigData): number {
  const pf = (config.pfRate / 100) * totalEarnings;
  const pt = config.professionalTax;
  return Math.round((pf + pt) * 100) / 100;
}

/**
 * Get net salary
 */
export function getNetSalary(totalEarnings: number, totalDeductions: number): number {
  return Math.round((totalEarnings - totalDeductions) * 100) / 100;
}

/**
 * Get detailed salary breakdown
 */
export function getSalaryBreakdown(
  components: SalaryComponent[],
  config: SalaryConfigData
) {
  const totalEarnings = getTotalEarnings(components);
  const pf = Math.round((config.pfRate / 100) * totalEarnings * 100) / 100;
  const pt = config.professionalTax;
  const totalDeductions = pf + pt;
  const netSalary = totalEarnings - totalDeductions;

  return {
    components,
    totalEarnings,
    deductions: {
      pf,
      professionalTax: pt,
      total: totalDeductions,
    },
    netSalary: Math.round(netSalary * 100) / 100,
  };
}
