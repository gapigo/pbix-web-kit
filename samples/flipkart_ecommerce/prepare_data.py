import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random
import pyarrow as pa
import pyarrow.parquet as pq
from pathlib import Path

random.seed(42)
np.random.seed(42)

n = 5000

categories_dict = {
    'Electronics': ['Smartphones', 'Laptops', 'Tablets', 'Headphones', 'Cameras'],
    'Clothing': ["Men's", "Women's", "Kids'", 'Footwear', 'Accessories'],
    'Home & Kitchen': ['Furniture', 'Cookware', 'Bedding', 'Decor', 'Appliances'],
    'Books': ['Fiction', 'Non-Fiction', 'Academic', "Children's", 'Comics'],
    'Sports': ['Fitness', 'Outdoor', 'Team Sports', 'Water Sports', 'Cycling'],
    'Beauty': ['Skincare', 'Haircare', 'Makeup', 'Fragrance', 'Personal Care'],
    'Toys': ['Action Figures', 'Board Games', 'Educational', 'Dolls', 'Remote Control'],
}
regions = ['North', 'South', 'East', 'West', 'Central']
segments = ['Consumer', 'Corporate', 'Home Office']
ship_modes = ['Standard Class', 'Second Class', 'First Class', 'Same Day']

start_date = datetime(2021, 1, 1)
rows = []
for i in range(n):
    cat = random.choice(list(categories_dict.keys()))
    sub = random.choice(categories_dict[cat])
    order_date = start_date + timedelta(days=random.randint(0, 365*3))
    ship_date = order_date + timedelta(days=random.randint(1, 7))
    quantity = random.randint(1, 10)
    base_price = random.uniform(10, 2000)
    discount = round(random.choice([0, 0, 0, 0.05, 0.1, 0.15, 0.2, 0.3]), 2)
    sales = round(base_price * quantity * (1 - discount), 2)
    profit = round(sales * random.uniform(-0.1, 0.4), 2)
    rows.append({
        'Order ID': f'ORD-{10000+i}',
        'Order Date': order_date.strftime('%Y-%m-%d'),
        'Ship Date': ship_date.strftime('%Y-%m-%d'),
        'Ship Mode': random.choice(ship_modes),
        'Customer ID': f'CUST-{random.randint(1000, 3000)}',
        'Customer Name': f'Customer {random.randint(1,500)}',
        'Segment': random.choice(segments),
        'Region': random.choice(regions),
        'Category': cat,
        'Sub-Category': sub,
        'Product Name': f'{sub} Product {random.randint(1,50)}',
        'Sales': sales,
        'Quantity': quantity,
        'Discount': discount,
        'Profit': profit,
    })

df = pd.DataFrame(rows)
df.columns = [c.strip().replace(' ', '_').replace('-', '_') for c in df.columns]
print(f'Generated {len(df)} rows')
print('Columns:', df.columns.tolist())

Path('samples/flipkart_ecommerce/parquet').mkdir(parents=True, exist_ok=True)
pq.write_table(pa.Table.from_pandas(df), 'samples/flipkart_ecommerce/parquet/Orders.parquet')

# Also copy to web app public dir
import shutil
Path('packages/pbix-web-app/public/data/flipkart').mkdir(parents=True, exist_ok=True)
shutil.copy('samples/flipkart_ecommerce/parquet/Orders.parquet', 'packages/pbix-web-app/public/data/flipkart/Orders.parquet')

print('Files created:')
for f in Path('samples/flipkart_ecommerce/parquet').glob('*.parquet'):
    t = pq.read_table(f)
    print(f'  {f.name}: {t.num_rows} rows, {t.num_columns} cols')
for f in Path('packages/pbix-web-app/public/data/flipkart').glob('*.parquet'):
    t = pq.read_table(f)
    print(f'  app/{f.name}: {t.num_rows} rows, {t.num_columns} cols')
