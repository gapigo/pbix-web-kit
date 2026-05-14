# E-Commerce Analytics Dashboard

## Narrativa geral
Dashboard de performance de e-commerce cobrindo vendas, lucro, categorias de produto e comportamento de clientes. Objetivo: identificar categorias lucrativas, regiões de crescimento e impacto de descontos no resultado.

## Pages

### 1. Executive Overview
Narrativa: visão de topo do negócio — receita, lucro, pedidos, ticket médio.
Filtros: Category (chips), Region (select), Segment (select)
Visuais: 4 KPIs (Total Sales, Total Profit, Orders, Profit Margin %), Bar: Sales by Category, Line: Sales trend (monthly), Bar: Sales by Region

### 2. Product Analysis
Narrativa: quais categorias geram mais receita e lucro?
Filtros: Category (chips), Sub-Category (select)
Visuais: KPIs (Top Category Sales, Best Margin Category), Bar: Sales by Sub-Category Top 10, Bar: Profit by Sub-Category, Scatter: Sales vs Profit by Sub-Category, Table

### 3. Regional Performance
Narrativa: onde estamos crescendo? Onde perdendo?
Filtros: Region (chips), Segment (select)
Visuais: KPIs (Best Region, Worst Region), Bar: Sales by Region, Bar: Profit Margin by Region, Table

### 4. Discount Impact
Narrativa: descontos estão destruindo margem?
Filtros: Category (chips), Discount range (select)
Visuais: KPIs (Avg Discount, Revenue at Risk), Bar: Avg Discount by Category, Scatter: Discount vs Profit Margin, Table

### 5. Customer Segments
Narrativa: quem são os melhores clientes?
Filtros: Segment (chips), Ship Mode (select)
Visuais: KPIs (Top Segment Sales, Avg Order), Bar: Sales by Segment, Bar: Profit Margin by Segment, Table

### 6. Shipping Analysis
Narrativa: métodos de envio afetam lucratividade?
Filtros: Ship Mode (chips), Category (select)
Visuais: KPIs (Avg Delivery Days, Same Day %), Bar: Orders by Ship Mode, Line: Orders over time by Ship Mode, Table
