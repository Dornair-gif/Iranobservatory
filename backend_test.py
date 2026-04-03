#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class IranObservatoryAPITester:
    def __init__(self, base_url="https://iran-events-live.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.session = requests.Session()
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    {details}")

    def test_health_check(self):
        """Test API health endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/")
            success = response.status_code == 200
            details = f"Status: {response.status_code}, Response: {response.json()}"
            self.log_test("API Health Check", success, details)
            return success
        except Exception as e:
            self.log_test("API Health Check", False, f"Error: {str(e)}")
            return False

    def test_login(self):
        """Test admin login"""
        try:
            login_data = {
                "email": "admin@iranobservatory.org",
                "password": "IranObs2024!"
            }
            response = self.session.post(f"{self.base_url}/auth/login", json=login_data)
            success = response.status_code == 200
            
            if success:
                user_data = response.json()
                details = f"Logged in as: {user_data.get('email')} ({user_data.get('role')})"
            else:
                details = f"Status: {response.status_code}, Error: {response.text}"
            
            self.log_test("Admin Login", success, details)
            return success
        except Exception as e:
            self.log_test("Admin Login", False, f"Error: {str(e)}")
            return False

    def test_auth_me(self):
        """Test authenticated user endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/auth/me")
            success = response.status_code == 200
            
            if success:
                user_data = response.json()
                details = f"User: {user_data.get('email')}, Role: {user_data.get('role')}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text}"
            
            self.log_test("Auth Me Endpoint", success, details)
            return success
        except Exception as e:
            self.log_test("Auth Me Endpoint", False, f"Error: {str(e)}")
            return False

    def test_stats(self):
        """Test dashboard stats endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/stats")
            success = response.status_code == 200
            
            if success:
                stats = response.json()
                details = f"Articles: {stats.get('total_articles')}, Published: {stats.get('published')}, Drafts: {stats.get('drafts')}, RSS Items: {stats.get('pending_rss_items')}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text}"
            
            self.log_test("Dashboard Stats", success, details)
            return success
        except Exception as e:
            self.log_test("Dashboard Stats", False, f"Error: {str(e)}")
            return False

    def test_rss_feeds(self):
        """Test RSS feeds endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/rss/feeds")
            success = response.status_code == 200
            
            if success:
                feeds = response.json()
                details = f"Found {len(feeds)} RSS feeds"
                if feeds:
                    details += f", First feed: {feeds[0].get('name')}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text}"
            
            self.log_test("RSS Feeds List", success, details)
            return success, feeds if success else []
        except Exception as e:
            self.log_test("RSS Feeds List", False, f"Error: {str(e)}")
            return False, []

    def test_fetch_rss_feed(self, feed_id):
        """Test fetching RSS feed"""
        try:
            response = self.session.post(f"{self.base_url}/rss/feeds/{feed_id}/fetch")
            success = response.status_code == 200
            
            if success:
                result = response.json()
                details = f"Fetch result: {result.get('message')}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text}"
            
            self.log_test("RSS Feed Fetch", success, details)
            return success
        except Exception as e:
            self.log_test("RSS Feed Fetch", False, f"Error: {str(e)}")
            return False

    def test_rss_items(self):
        """Test RSS items endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/rss/items?processed=false")
            success = response.status_code == 200
            
            if success:
                items = response.json()
                details = f"Found {len(items)} unprocessed RSS items"
            else:
                details = f"Status: {response.status_code}, Error: {response.text}"
            
            self.log_test("RSS Items List", success, details)
            return success, items if success else []
        except Exception as e:
            self.log_test("RSS Items List", False, f"Error: {str(e)}")
            return False, []

    def test_ai_generation(self, rss_item_id):
        """Test AI article generation"""
        try:
            gen_data = {
                "rss_item_id": rss_item_id,
                "target_languages": ["en", "fr", "fa"]
            }
            response = self.session.post(f"{self.base_url}/ai/generate", json=gen_data)
            success = response.status_code == 200
            
            if success:
                result = response.json()
                details = f"Generated article ID: {result.get('id')}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text}"
            
            self.log_test("AI Article Generation", success, details)
            return success, result.get('id') if success else None
        except Exception as e:
            self.log_test("AI Article Generation", False, f"Error: {str(e)}")
            return False, None

    def test_articles_admin(self):
        """Test admin articles endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/articles/admin")
            success = response.status_code == 200
            
            if success:
                articles = response.json()
                details = f"Found {len(articles)} articles"
                if articles:
                    statuses = {}
                    for article in articles:
                        status = article.get('status', 'unknown')
                        statuses[status] = statuses.get(status, 0) + 1
                    details += f", Status breakdown: {statuses}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text}"
            
            self.log_test("Admin Articles List", success, details)
            return success, articles if success else []
        except Exception as e:
            self.log_test("Admin Articles List", False, f"Error: {str(e)}")
            return False, []

    def test_publish_article(self, article_id):
        """Test publishing an article"""
        try:
            response = self.session.post(f"{self.base_url}/articles/{article_id}/publish")
            success = response.status_code == 200
            
            if success:
                result = response.json()
                details = f"Publish result: {result.get('message')}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text}"
            
            self.log_test("Article Publish", success, details)
            return success
        except Exception as e:
            self.log_test("Article Publish", False, f"Error: {str(e)}")
            return False

    def test_public_articles(self):
        """Test public articles endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/articles?status=published")
            success = response.status_code == 200
            
            if success:
                articles = response.json()
                details = f"Found {len(articles)} published articles"
            else:
                details = f"Status: {response.status_code}, Error: {response.text}"
            
            self.log_test("Public Articles List", success, details)
            return success
        except Exception as e:
            self.log_test("Public Articles List", False, f"Error: {str(e)}")
            return False

    def test_logout(self):
        """Test logout"""
        try:
            response = self.session.post(f"{self.base_url}/auth/logout")
            success = response.status_code == 200
            
            if success:
                result = response.json()
                details = f"Logout result: {result.get('message')}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text}"
            
            self.log_test("Logout", success, details)
            return success
        except Exception as e:
            self.log_test("Logout", False, f"Error: {str(e)}")
            return False

    def run_comprehensive_test(self):
        """Run all tests in sequence"""
        print("🚀 Starting Iran Observatory API Tests")
        print("=" * 50)
        
        # Basic connectivity
        if not self.test_health_check():
            print("❌ API is not accessible. Stopping tests.")
            return False
        
        # Authentication flow
        if not self.test_login():
            print("❌ Login failed. Stopping tests.")
            return False
        
        # Authenticated endpoints
        self.test_auth_me()
        self.test_stats()
        
        # RSS functionality
        feeds_success, feeds = self.test_rss_feeds()
        if feeds_success and feeds:
            # Test fetching the first feed
            self.test_fetch_rss_feed(feeds[0]['id'])
            
            # Get RSS items
            items_success, items = self.test_rss_items()
            
            # Test AI generation if we have items
            if items_success and items:
                ai_success, article_id = self.test_ai_generation(items[0]['id'])
                
                # Test article management
                articles_success, articles = self.test_articles_admin()
                
                # Test publishing if we have a draft article
                if articles_success and articles:
                    draft_articles = [a for a in articles if a.get('status') == 'draft']
                    if draft_articles:
                        self.test_publish_article(draft_articles[0]['id'])
        
        # Test public endpoints
        self.test_public_articles()
        
        # Cleanup
        self.test_logout()
        
        # Summary
        print("\n" + "=" * 50)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        return success_rate >= 80

def main():
    tester = IranObservatoryAPITester()
    success = tester.run_comprehensive_test()
    
    # Save detailed results
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            'summary': {
                'tests_run': tester.tests_run,
                'tests_passed': tester.tests_passed,
                'success_rate': (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
            },
            'results': tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())