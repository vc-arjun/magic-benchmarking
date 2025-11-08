import { logger } from './logger';
import os from 'os';

export interface SystemInfo {
  timestamp: string;
  device: {
    platform: string;
    arch: string;
    cpus: {
      model: string;
      cores: number;
      speed: number; // MHz
    };
    memory: {
      total: number; // bytes
      free: number; // bytes
      used: number; // bytes
    };
    os: {
      type: string;
      release: string;
      version: string;
    };
  };
  network: {
    hostname: string;
    networkInterfaces: Array<{
      name: string;
      family: string;
      address: string;
      internal: boolean;
    }>;
  };
  runtime: {
    node: string;
    v8: string;
    timezone: string;
    locale: string;
  };
}

/**
 * Capture comprehensive system information for baseline context
 */
export async function captureSystemInfo(): Promise<SystemInfo> {
  try {
    const cpus = os.cpus();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    // Get network interfaces (excluding internal/loopback)
    const networkInterfaces = os.networkInterfaces();
    const externalInterfaces: Array<{
      name: string;
      family: string;
      address: string;
      internal: boolean;
    }> = [];

    Object.entries(networkInterfaces).forEach(([name, interfaces]) => {
      if (interfaces) {
        interfaces.forEach((iface) => {
          // Include both internal and external for complete picture
          externalInterfaces.push({
            name,
            family: iface.family,
            address: iface.address,
            internal: iface.internal,
          });
        });
      }
    });

    const systemInfo: SystemInfo = {
      timestamp: new Date().toISOString(),
      device: {
        platform: os.platform(),
        arch: os.arch(),
        cpus: {
          model: cpus[0]?.model || 'Unknown',
          cores: cpus.length,
          speed: cpus[0]?.speed || 0,
        },
        memory: {
          total: totalMemory,
          free: freeMemory,
          used: usedMemory,
        },
        os: {
          type: os.type(),
          release: os.release(),
          version: os.version(),
        },
      },
      network: {
        hostname: os.hostname(),
        networkInterfaces: externalInterfaces,
      },
      runtime: {
        node: process.version,
        v8: process.versions.v8,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: Intl.DateTimeFormat().resolvedOptions().locale,
      },
    };

    logger.info('System information captured', {
      platform: systemInfo.device.platform,
      arch: systemInfo.device.arch,
      cpuModel: systemInfo.device.cpus.model,
      cores: systemInfo.device.cpus.cores,
      totalMemoryGB: Math.round(systemInfo.device.memory.total / 1024 / 1024 / 1024),
      hostname: systemInfo.network.hostname,
    });

    return systemInfo;
  } catch (error) {
    logger.error(
      'Failed to capture system information',
      error instanceof Error ? error : new Error(String(error))
    );

    // Return minimal fallback info
    return {
      timestamp: new Date().toISOString(),
      device: {
        platform: 'unknown',
        arch: 'unknown',
        cpus: {
          model: 'Unknown',
          cores: 1,
          speed: 0,
        },
        memory: {
          total: 0,
          free: 0,
          used: 0,
        },
        os: {
          type: 'unknown',
          release: 'unknown',
          version: 'unknown',
        },
      },
      network: {
        hostname: 'unknown',
        networkInterfaces: [],
      },
      runtime: {
        node: process.version || 'unknown',
        v8: process.versions.v8 || 'unknown',
        timezone: 'unknown',
        locale: 'unknown',
      },
    };
  }
}

/**
 * Format system info for display in dashboard
 */
export function formatSystemInfoForDisplay(systemInfo: SystemInfo): {
  device: string;
  cpu: string;
  memory: string;
  network: string;
  os: string;
} {
  const memoryGB = Math.round(systemInfo.device.memory.total / 1024 / 1024 / 1024);
  const memoryUsedGB = Math.round(systemInfo.device.memory.used / 1024 / 1024 / 1024);
  const memoryFreeGB = Math.round(systemInfo.device.memory.free / 1024 / 1024 / 1024);

  // Get primary external network interface
  const primaryInterface = systemInfo.network.networkInterfaces.find(
    (iface) => !iface.internal && iface.family === 'IPv4'
  );

  return {
    device: `${systemInfo.device.platform} ${systemInfo.device.arch}`,
    cpu: `${systemInfo.device.cpus.model} (${systemInfo.device.cpus.cores} cores @ ${systemInfo.device.cpus.speed}MHz)`,
    memory: `${memoryGB}GB total (${memoryUsedGB}GB used, ${memoryFreeGB}GB free)`,
    network: primaryInterface
      ? `${primaryInterface.address} (${primaryInterface.name})`
      : `${systemInfo.network.hostname} (no external interface detected)`,
    os: `${systemInfo.device.os.type} ${systemInfo.device.os.release}`,
  };
}
