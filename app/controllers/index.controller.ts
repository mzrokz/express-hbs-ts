/* app/controllers/welcome.controller.ts */

// Import only what we need from express
import { Router, Request, Response } from 'express';
import Deal from '../models/deal';

import { Client } from 'pg';

const client = new Client({
    user: 'test-assignment',
    host: 'test-instance-1-cluster.cluster-cys30lik4v4w.us-east-1.rds.amazonaws.com',
    database: 'test_assignment',
    password: 'gfdjh24m,sddsf',
    port: 5432
});

client.connect().then(r => console.log('Connected to DB')).catch(e => console.log(e));

// Assign router to the express.Router() instance
const router: Router = Router();


// The / here corresponds to the route that the WelcomeController
// is mounted on in the server.ts file.
// In this case it's /welcome

router.get('/brokers', async (req: Request, res: Response) => {
    let brokers = await client.query(`
    Select 
    Count(1) as Listing_Count,
    x.broker_id,
    x.broker,
    x.Listing_Month,
    ROUND(AVG(x.revenue)::numeric,2) as Avg_Revenue
    from (
    Select 
    s.id as broker_id,
    s.title as broker,
    EXTRACT(Month FROM d.listing_date) as Listing_Month,
    d.revenue
    from deals d
    inner join sites s on d.site_id = s.id
        where d.listing_date between '2020-11-01' and '2021-11-30'
    ) as x
    group by x.Listing_Month, x.broker, x.broker_id
    order by x.broker_id, x.Listing_Month asc
    `);

    res.json(brokers.rows);
});

router.get('/', async (req: Request, res: Response) => {
    // Reply with a hello world when no name param is provided
    let db = await client.query(`Select d.id as Listing_Id,
    d.listing_date as Listing_Date,
    EXTRACT(Month FROM d.listing_date) as Listing_Month,
    s.title as broker,
    d.revenue
    from deals d
    inner join sites s on d.site_id = s.id `);



    let table_data = db.rows.map(r => {
        let deal: Deal = new Deal(r.listing_id, r.listing_date, r.listing_month, r.revenue);
        return { ...deal, broker: r.broker };
    });

    res.render('index', { data: table_data });
});

router.get('/:name', (req: Request, res: Response) => {
    // Extract the name from the request parameters
    let { name } = req.params;

    // Greet the given name
    res.render('index', { message: `Hello, ${name}` });
});


// Export the express.Router() instance to be used by server.ts
export const IndexController: Router = router;