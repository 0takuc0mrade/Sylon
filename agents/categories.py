import json
import pandas as pd
from tqdm import tqdm

# these are the broad categories that are necessary
CATEGORY_MAP = {
    'restaurant': ['Restaurants', 'Bukka', 'Mama Put', 'Buka', 'Canteen' 'Food', 'Breakfast', 'Brunch', 'Lunch', 'Dinner', 'Fast Food', 'Pizza', 'Burgers', 'Sushi', 'Jollof', 'Suya', 'Grill', 'Chinese', 'Italian', 'Mexican', 'Thai', 'Japanese', 'Indian', 'Vietnamese', 'Mediterranean'],
    'bar': ['Bars', 'Nightlife', 'Cocktail Bars', 'Sports Bars', 'Wine Bars', 'Beer Bar', 'Pubs', 'Breweries'],
    'cafe': ['Coffee', 'Cafes', 'Tea Rooms', 'Juice Bars', 'Smoothies'],
    'hotel': ['Hotels', 'Resorts', 'Bed & Breakfast', 'Hostels', 'Vacation Rentals'],
    'shopping': ['Shopping', 'Fashion', 'Clothing', 'Accessories', 'Department Stores', 'Boutiques'],
    'health': ['Health', 'Medical', 'Fitness', 'Gyms', 'Yoga', 'Spas', 'Beauty', 'Hair Salons', 'Nail Salons'],
    'entertainment': ['Arts', 'Entertainment', 'Music Venues', 'Cinema', 'Movies', 'Theater', 'Museums', 'Art Galleries'],
    'services': ['Automotive', 'Home Services', 'Local Services', 'Professional Services']
}


def get_primary_category(categories_str):
    # takes a raw categories string and returns the single most relevant broad category
    if not categories_str:
        return 'other'
    
    cats = categories_str.lower()
    
    for broad_category, keywords in CATEGORY_MAP.items():
        for keyword in keywords:
            if keyword.lower() in cats:
                return broad_category
    
    return 'other'


def build_lookup(business_path, output_path='data/business_categories.csv'):
    
    records = []
    
    print("Building category lookup...")
    with open(business_path, 'r', encoding='utf-8') as f:
        for line in tqdm(f):
            b = json.loads(line)
            records.append({
                'business_id': b['business_id'],
                'name': b.get('name', ''),
                'city': b.get('city', ''),
                'state': b.get('state', ''),
                'stars': b.get('stars', 0),
                'review_count':b.get('review_count', 0),
                'categories':b.get('categories', ''),
                'primary_category': get_primary_category(b.get('categories', ''))
            })
    
    lookup = pd.DataFrame(records)
    lookup.to_csv(output_path, index=False)
    
    print(f"\nSaved {len(lookup)} businesses to {output_path}")
    print("\nCategory distribution:")
    print(lookup['primary_category'].value_counts())
    
    return lookup


if __name__ == "__main__":
    lookup = build_lookup('data/yelp_academic_dataset_business.json')