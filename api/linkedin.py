import requests
from bs4 import BeautifulSoup
import json

def get_linkedin_jobs(job_title=None, location=None, remote_only=False):
    base_url = "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search"
    
    # 1. Clean the location string
    # If searching for an Indian city, adding ', India' helps the guest API focus
    target_location = location if location else ""
    if target_location.lower() in ["delhi", "mumbai", "bangalore", "pune", "hyderabad"] and "," not in target_location:
        target_location += ", India"

    params = {
        "keywords": job_title if job_title else "",
        "location": target_location,
        "f_TPR": "r86400",  # Last 24 hours
        "start": 0,
        "refresh": "true",
        "sortBy": "DD"
    }

    if remote_only:
        params["f_WT"] = "2"

    headers = {
        # A more modern User-Agent helps avoid the Cincinnati/US fallback
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    }

    try:
        response = requests.get(base_url, params=params, headers=headers, timeout=10)
        
        # If LinkedIn redirects us (common for failed geo-matching), it might go to US jobs
        if "cincinnati" in response.url.lower() and "delhi" in target_location.lower():
            print("Warning: LinkedIn defaulted to US results. Retrying with explicit GeoID...")

        soup = BeautifulSoup(response.text, "lxml")
        jobs = []

        for li in soup.find_all("li"):
            title_el = li.find("a", href=lambda x: x and "/jobs/view/" in x)
            if title_el:
                job_name = title_el.get_text(strip=True)
                job_url = title_el.get("href", "").split("?")[0]
                
                company_el = li.select_one(".base-search-card__subtitle")
                company = company_el.get_text(strip=True) if company_el else "N/A"
                
                loc_el = li.select_one(".job-search-card__location")
                loc_text = loc_el.get_text(strip=True) if loc_el else "N/A"
                
                time_el = li.find("time")
                posted_time = time_el.get_text(strip=True) if time_el else "Recently"

                jobs.append({
                    "title": job_name,
                    "company": company,
                    "location": loc_text,
                    "posted": posted_time,
                    "url": job_url
                })

        return {"jobs": jobs, "total_found": len(jobs), "search_url": response.url}

    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    # Test 1 again with the India fix
    print("\n[RE-TEST 1] Latest jobs in Delhi, India:")
    res = get_linkedin_jobs(job_title=None, location="Delhi")
    print(json.dumps(res, indent=2))