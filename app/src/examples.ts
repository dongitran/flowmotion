import type { FlowExample } from './types';

const orderFlowSource = `
type Order = {
  id: string;
  sku: string;
  amount: number;
}

@Injectable
class InventoryService {
  @Show
  reservedSku = '';

  @Show
  reservedAmount = 0;

  reserve(order: Order) {
    std.log('reserve inventory', order.sku);
    this.reservedSku = order.sku;
    this.reservedAmount = order.amount;
    return { reservationId: \`res-\${order.id}\`, sku: order.sku };
  }
}

@Injectable
class PaymentService {
  authorize(order: Order) {
    std.sleep(1);
    std.log('authorize payment', order.id);
    return { authId: \`pay-\${order.id}\`, approved: true };
  }
}

@Injectable
class WarehouseQueue {
  @Show
  latestJob = '';

  enqueue(order: Order) {
    this.latestJob = order.id;
    std.log('warehouse job queued', order.id);
  }
}

@Injectable
class OrderService {
  private inventory = std.resolve(InventoryService);
  private payment = std.resolve(PaymentService);
  private warehouse = std.resolve(WarehouseQueue);

  fulfill(order: Order) {
    const reservation = this.inventory.reserve(order);
    const payment = this.payment.authorize(order);

    if (!payment.approved) {
      return 'payment_failed';
    }

    this.warehouse.enqueue(order);
    std.log('fulfilled', reservation.reservationId, payment.authId);
    return 'fulfilled';
  }
}
`;

const cacheFlowSource = `
type UserProfile = {
  id: string;
  name: string;
}

@KeyValue
class ProfileCache {
  @Show
  data: Map<string, UserProfile> = new Map();

  get(id: string) {
    return this.data.get(id);
  }

  set(id: string, profile: UserProfile) {
    this.data.set(id, profile);
    return profile;
  }
}

@Injectable
@Table(['id', 'name'])
class ProfileTable {
  @Show
  rows: UserProfile[] = [{ id: 'u-42', name: 'Linh Nguyen' }];

  find(id: string) {
    return this.rows.find((profile) => profile.id === id);
  }
}

@Injectable
class ProfileService {
  private cache = new ProfileCache();
  private table = std.resolve(ProfileTable);

  getProfile(id: string) {
    const cached = this.cache.get(id);
    if (cached) {
      std.log('cache hit', id);
      return cached;
    }

    std.log('cache miss', id);
    const profile = this.table.find(id);
    if (!profile) {
      return;
    }

    return this.cache.set(id, profile);
  }
}
`;

const incidentFlowSource = `
type Incident = {
  id: string;
  severity: 'low' | 'high';
  service: string;
}

@Injectable
class PagerDuty {
  notify(incident: Incident) {
    std.sleep(1);
    std.log('page on-call', incident.service);
    return \`paged-\${incident.id}\`;
  }
}

@Injectable
class StatusPage {
  publish(incident: Incident) {
    std.sleep(2);
    std.log('publish status page', incident.service);
    return \`status-\${incident.id}\`;
  }
}

@Injectable
class IncidentCommander {
  private pagerDuty = std.resolve(PagerDuty);
  private statusPage = std.resolve(StatusPage);

  triage(incident: Incident) {
    std.log('triage incident', incident.id);

    if (incident.severity === 'high') {
      const page = this.pagerDuty.notify(incident);
      const status = this.statusPage.publish(incident);
      std.log('escalated', page, status);
      return 'escalated';
    }

    return 'logged';
  }
}
`;

export const examples: FlowExample[] = [
	{
		id: 'order',
		title: 'Order fulfillment flow',
		summary: 'API-to-service orchestration across inventory, payment, and warehouse queue.',
		project: [
			{ type: 'folder', path: 'app' },
			{ type: 'file', path: 'app/order-flow.ts', value: orderFlowSource },
		],
		storySetups: [
			{
				id: 'order-default',
				title: 'Fulfill paid order',
				script: {
					raw: `const service = std.resolve(OrderService);
std.flow('Fulfill order', service).fulfill({
  id: 'ord-1001',
  sku: 'keyboard-pro',
  amount: 1,
}).run();`,
					compiled: `const service = std.resolve(OrderService);
std.flow('Fulfill order', service).fulfill({
  id: 'ord-1001',
  sku: 'keyboard-pro',
  amount: 1,
}).run();`,
				},
			},
		],
	},
	{
		id: 'cache',
		title: 'Cache read-through',
		summary:
			'A service checks cache first, falls back to the source table, then hydrates cache.',
		project: [
			{ type: 'folder', path: 'app' },
			{ type: 'file', path: 'app/cache-flow.ts', value: cacheFlowSource },
		],
		storySetups: [
			{
				id: 'cache-default',
				title: 'Read profile through cache',
				script: {
					raw: `const service = std.resolve(ProfileService);
std.flow('Read profile', service).getProfile('u-42').run();`,
					compiled: `const service = std.resolve(ProfileService);
std.flow('Read profile', service).getProfile('u-42').run();`,
				},
			},
		],
	},
	{
		id: 'incident',
		title: 'Incident escalation',
		summary: 'A high-severity incident fans out to paging and customer-facing status updates.',
		project: [
			{ type: 'folder', path: 'app' },
			{ type: 'file', path: 'app/incident-flow.ts', value: incidentFlowSource },
		],
		storySetups: [
			{
				id: 'incident-default',
				title: 'Escalate production incident',
				script: {
					raw: `const commander = std.resolve(IncidentCommander);
std.flow('Triage incident', commander).triage({
  id: 'inc-77',
  severity: 'high',
  service: 'checkout',
}).run();`,
					compiled: `const commander = std.resolve(IncidentCommander);
std.flow('Triage incident', commander).triage({
  id: 'inc-77',
  severity: 'high',
  service: 'checkout',
}).run();`,
				},
			},
		],
	},
];
