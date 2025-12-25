#!/usr/bin/env python3
"""
HAL API Backend Testing Suite
Tests all backend API endpoints for the HAL application
"""

import requests
import json
import sys
from datetime import datetime
import uuid

# Backend URL from frontend .env
BASE_URL = "https://hal-rebuild.preview.emergentagent.com/api"

class HALAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.auth_token = None
        self.test_user_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        self.test_user_password = "TestPassword123!"
        self.test_results = []
        
    def log_test(self, test_name, success, details="", response_data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if response_data and not success:
            print(f"   Response: {response_data}")
        print()
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "response": response_data
        })
    
    def test_root_endpoint(self):
        """Test GET /api/ - Root endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/")
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "HAL API" in data["message"]:
                    self.log_test("GET /api/ - Root endpoint", True, f"Message: {data['message']}")
                else:
                    self.log_test("GET /api/ - Root endpoint", False, "Unexpected response format", data)
            else:
                self.log_test("GET /api/ - Root endpoint", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("GET /api/ - Root endpoint", False, f"Exception: {str(e)}")
    
    def test_get_categories(self):
        """Test GET /api/categories"""
        try:
            response = self.session.get(f"{self.base_url}/categories")
            if response.status_code == 200:
                categories = response.json()
                if isinstance(categories, list) and len(categories) > 0:
                    # Check if categories have required fields
                    first_cat = categories[0]
                    required_fields = ["id", "nameUk", "nameRu", "count"]
                    if all(field in first_cat for field in required_fields):
                        self.log_test("GET /api/categories", True, f"Found {len(categories)} categories")
                    else:
                        self.log_test("GET /api/categories", False, "Missing required fields in category", first_cat)
                else:
                    self.log_test("GET /api/categories", False, "Empty or invalid categories list", categories)
            else:
                self.log_test("GET /api/categories", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("GET /api/categories", False, f"Exception: {str(e)}")
    
    def test_get_companies_basic(self):
        """Test GET /api/companies - Basic functionality"""
        try:
            response = self.session.get(f"{self.base_url}/companies")
            if response.status_code == 200:
                data = response.json()
                required_fields = ["companies", "total", "page", "pages"]
                if all(field in data for field in required_fields):
                    companies = data["companies"]
                    if isinstance(companies, list):
                        self.log_test("GET /api/companies - Basic", True, 
                                    f"Found {len(companies)} companies, total: {data['total']}")
                        return companies  # Return for use in other tests
                    else:
                        self.log_test("GET /api/companies - Basic", False, "Companies is not a list", data)
                else:
                    self.log_test("GET /api/companies - Basic", False, "Missing required fields", data)
            else:
                self.log_test("GET /api/companies - Basic", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("GET /api/companies - Basic", False, f"Exception: {str(e)}")
        return []
    
    def test_get_companies_pagination(self):
        """Test GET /api/companies - Pagination"""
        try:
            # Test with page=1, limit=5
            response = self.session.get(f"{self.base_url}/companies?page=1&limit=5")
            if response.status_code == 200:
                data = response.json()
                if len(data["companies"]) <= 5 and data["page"] == 1:
                    self.log_test("GET /api/companies - Pagination", True, 
                                f"Page 1 with limit 5: {len(data['companies'])} companies")
                else:
                    self.log_test("GET /api/companies - Pagination", False, 
                                "Pagination not working correctly", data)
            else:
                self.log_test("GET /api/companies - Pagination", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("GET /api/companies - Pagination", False, f"Exception: {str(e)}")
    
    def test_get_companies_filtering(self):
        """Test GET /api/companies - Category filtering"""
        try:
            # Test filtering by category
            response = self.session.get(f"{self.base_url}/companies?category=cafe")
            if response.status_code == 200:
                data = response.json()
                companies = data["companies"]
                # Check if all companies have cafe category
                if all(company.get("category") == "cafe" for company in companies):
                    self.log_test("GET /api/companies - Category Filter", True, 
                                f"Found {len(companies)} cafe companies")
                else:
                    self.log_test("GET /api/companies - Category Filter", False, 
                                "Category filtering not working", companies)
            else:
                self.log_test("GET /api/companies - Category Filter", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("GET /api/companies - Category Filter", False, f"Exception: {str(e)}")
    
    def test_get_companies_search(self):
        """Test GET /api/companies - Search functionality"""
        try:
            # Test search
            response = self.session.get(f"{self.base_url}/companies?search=кафе")
            if response.status_code == 200:
                data = response.json()
                self.log_test("GET /api/companies - Search", True, 
                            f"Search for 'кафе' returned {len(data['companies'])} results")
            else:
                self.log_test("GET /api/companies - Search", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("GET /api/companies - Search", False, f"Exception: {str(e)}")
    
    def test_get_companies_sorting(self):
        """Test GET /api/companies - Sorting"""
        try:
            # Test different sort options
            sort_options = ["recent", "popular", "rating"]
            for sort_option in sort_options:
                response = self.session.get(f"{self.base_url}/companies?sort={sort_option}")
                if response.status_code == 200:
                    data = response.json()
                    self.log_test(f"GET /api/companies - Sort by {sort_option}", True, 
                                f"Returned {len(data['companies'])} companies")
                else:
                    self.log_test(f"GET /api/companies - Sort by {sort_option}", False, 
                                f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("GET /api/companies - Sorting", False, f"Exception: {str(e)}")
    
    def test_get_company_details(self, companies):
        """Test GET /api/companies/{id}"""
        if not companies:
            self.log_test("GET /api/companies/{id}", False, "No companies available for testing")
            return
        
        try:
            # Use first company ID
            company_id = companies[0]["_id"]
            response = self.session.get(f"{self.base_url}/companies/{company_id}")
            if response.status_code == 200:
                company = response.json()
                required_fields = ["_id", "name", "nameRu", "description", "category", "location", "contacts"]
                if all(field in company for field in required_fields):
                    self.log_test("GET /api/companies/{id}", True, f"Retrieved company: {company['name']}")
                else:
                    self.log_test("GET /api/companies/{id}", False, "Missing required fields", company)
            else:
                self.log_test("GET /api/companies/{id}", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("GET /api/companies/{id}", False, f"Exception: {str(e)}")
    
    def test_get_company_invalid_id(self):
        """Test GET /api/companies/{id} with invalid ID"""
        try:
            response = self.session.get(f"{self.base_url}/companies/invalid_id")
            if response.status_code == 400:
                self.log_test("GET /api/companies/{invalid_id}", True, "Correctly returned 400 for invalid ID")
            else:
                self.log_test("GET /api/companies/{invalid_id}", False, 
                            f"Expected 400, got {response.status_code}", response.text)
        except Exception as e:
            self.log_test("GET /api/companies/{invalid_id}", False, f"Exception: {str(e)}")
    
    def test_auth_register(self):
        """Test POST /api/auth/register"""
        try:
            user_data = {
                "name": "Test User",
                "email": self.test_user_email,
                "password": self.test_user_password,
                "phone": "+380501234567"
            }
            
            response = self.session.post(f"{self.base_url}/auth/register", json=user_data)
            if response.status_code == 201:
                data = response.json()
                if "user" in data and "token" in data:
                    self.auth_token = data["token"]
                    self.log_test("POST /api/auth/register", True, f"User registered: {data['user']['email']}")
                else:
                    self.log_test("POST /api/auth/register", False, "Missing user or token in response", data)
            else:
                self.log_test("POST /api/auth/register", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("POST /api/auth/register", False, f"Exception: {str(e)}")
    
    def test_auth_register_duplicate(self):
        """Test POST /api/auth/register with duplicate email"""
        try:
            user_data = {
                "name": "Test User 2",
                "email": self.test_user_email,  # Same email as before
                "password": "AnotherPassword123!"
            }
            
            response = self.session.post(f"{self.base_url}/auth/register", json=user_data)
            if response.status_code == 400:
                self.log_test("POST /api/auth/register - Duplicate Email", True, "Correctly rejected duplicate email")
            else:
                self.log_test("POST /api/auth/register - Duplicate Email", False, 
                            f"Expected 400, got {response.status_code}", response.text)
        except Exception as e:
            self.log_test("POST /api/auth/register - Duplicate Email", False, f"Exception: {str(e)}")
    
    def test_auth_login_valid(self):
        """Test POST /api/auth/login with valid credentials"""
        try:
            login_data = {
                "email": self.test_user_email,
                "password": self.test_user_password
            }
            
            response = self.session.post(f"{self.base_url}/auth/login", json=login_data)
            if response.status_code == 200:
                data = response.json()
                if "user" in data and "token" in data:
                    self.auth_token = data["token"]
                    self.log_test("POST /api/auth/login - Valid", True, f"Login successful: {data['user']['email']}")
                else:
                    self.log_test("POST /api/auth/login - Valid", False, "Missing user or token in response", data)
            else:
                self.log_test("POST /api/auth/login - Valid", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("POST /api/auth/login - Valid", False, f"Exception: {str(e)}")
    
    def test_auth_login_invalid(self):
        """Test POST /api/auth/login with invalid credentials"""
        try:
            login_data = {
                "email": self.test_user_email,
                "password": "WrongPassword123!"
            }
            
            response = self.session.post(f"{self.base_url}/auth/login", json=login_data)
            if response.status_code == 401:
                self.log_test("POST /api/auth/login - Invalid", True, "Correctly rejected invalid credentials")
            else:
                self.log_test("POST /api/auth/login - Invalid", False, 
                            f"Expected 401, got {response.status_code}", response.text)
        except Exception as e:
            self.log_test("POST /api/auth/login - Invalid", False, f"Exception: {str(e)}")
    
    def test_auth_me(self):
        """Test GET /api/auth/me with authentication"""
        if not self.auth_token:
            self.log_test("GET /api/auth/me", False, "No auth token available")
            return
        
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = self.session.get(f"{self.base_url}/auth/me", headers=headers)
            if response.status_code == 200:
                user = response.json()
                if "email" in user and user["email"] == self.test_user_email:
                    self.log_test("GET /api/auth/me", True, f"Retrieved user: {user['email']}")
                else:
                    self.log_test("GET /api/auth/me", False, "Unexpected user data", user)
            else:
                self.log_test("GET /api/auth/me", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("GET /api/auth/me", False, f"Exception: {str(e)}")
    
    def test_auth_me_no_token(self):
        """Test GET /api/auth/me without authentication"""
        try:
            response = self.session.get(f"{self.base_url}/auth/me")
            if response.status_code == 403:
                self.log_test("GET /api/auth/me - No Token", True, "Correctly rejected request without token")
            else:
                self.log_test("GET /api/auth/me - No Token", False, 
                            f"Expected 403, got {response.status_code}", response.text)
        except Exception as e:
            self.log_test("GET /api/auth/me - No Token", False, f"Exception: {str(e)}")
    
    def test_create_company(self):
        """Test POST /api/companies with authentication"""
        if not self.auth_token:
            self.log_test("POST /api/companies", False, "No auth token available")
            return
        
        try:
            company_data = {
                "name": "Test Company",
                "nameRu": "Тестовая Компания",
                "description": "A test company for API testing",
                "descriptionRu": "Тестовая компания для тестирования API",
                "category": "other",
                "location": {
                    "city": "Kyiv",
                    "address": "Test Street, 123"
                },
                "contacts": {
                    "phone": "+380501234567",
                    "email": "test@company.com",
                    "website": "https://testcompany.com"
                },
                "image": "https://example.com/test-image.jpg",
                "isNew": True,
                "isActive": True
            }
            
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = self.session.post(f"{self.base_url}/companies", json=company_data, headers=headers)
            if response.status_code == 201:
                company = response.json()
                if "name" in company and company["name"] == "Test Company":
                    self.log_test("POST /api/companies", True, f"Company created: {company['name']}")
                else:
                    self.log_test("POST /api/companies", False, "Unexpected company data", company)
            else:
                self.log_test("POST /api/companies", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("POST /api/companies", False, f"Exception: {str(e)}")
    
    def test_create_company_no_auth(self):
        """Test POST /api/companies without authentication"""
        try:
            company_data = {
                "name": "Unauthorized Company",
                "nameRu": "Неавторизованная Компания",
                "description": "Should not be created",
                "descriptionRu": "Не должна быть создана",
                "category": "other",
                "location": {"city": "Kyiv", "address": "Test Street, 123"},
                "contacts": {"phone": "+380501234567", "email": "test@company.com"},
                "image": "https://example.com/test-image.jpg"
            }
            
            response = self.session.post(f"{self.base_url}/companies", json=company_data)
            if response.status_code == 403:
                self.log_test("POST /api/companies - No Auth", True, "Correctly rejected unauthorized request")
            else:
                self.log_test("POST /api/companies - No Auth", False, 
                            f"Expected 403, got {response.status_code}", response.text)
        except Exception as e:
            self.log_test("POST /api/companies - No Auth", False, f"Exception: {str(e)}")
    
    def test_get_blog(self):
        """Test GET /api/blog"""
        try:
            response = self.session.get(f"{self.base_url}/blog")
            if response.status_code == 200:
                data = response.json()
                if "posts" in data and "total" in data:
                    posts = data["posts"]
                    self.log_test("GET /api/blog", True, f"Found {len(posts)} blog posts, total: {data['total']}")
                else:
                    self.log_test("GET /api/blog", False, "Missing posts or total in response", data)
            else:
                self.log_test("GET /api/blog", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("GET /api/blog", False, f"Exception: {str(e)}")
    
    def test_get_blog_pagination(self):
        """Test GET /api/blog with pagination"""
        try:
            response = self.session.get(f"{self.base_url}/blog?page=1&limit=1")
            if response.status_code == 200:
                data = response.json()
                if len(data["posts"]) <= 1:
                    self.log_test("GET /api/blog - Pagination", True, f"Pagination working: {len(data['posts'])} posts")
                else:
                    self.log_test("GET /api/blog - Pagination", False, "Pagination not working correctly", data)
            else:
                self.log_test("GET /api/blog - Pagination", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("GET /api/blog - Pagination", False, f"Exception: {str(e)}")
    
    def test_contact_message(self):
        """Test POST /api/contact"""
        try:
            contact_data = {
                "name": "Test Contact",
                "email": "contact@test.com",
                "message": "This is a test contact message from the API testing suite."
            }
            
            response = self.session.post(f"{self.base_url}/contact", json=contact_data)
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "successfully" in data["message"]:
                    self.log_test("POST /api/contact", True, "Contact message sent successfully")
                else:
                    self.log_test("POST /api/contact", False, "Unexpected response format", data)
            else:
                self.log_test("POST /api/contact", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("POST /api/contact", False, f"Exception: {str(e)}")
    
    def run_all_tests(self):
        """Run all API tests"""
        print("=" * 60)
        print("HAL API Backend Testing Suite")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)
        print()
        
        # Test basic endpoints
        self.test_root_endpoint()
        self.test_get_categories()
        
        # Test companies endpoints
        companies = self.test_get_companies_basic()
        self.test_get_companies_pagination()
        self.test_get_companies_filtering()
        self.test_get_companies_search()
        self.test_get_companies_sorting()
        self.test_get_company_details(companies)
        self.test_get_company_invalid_id()
        
        # Test authentication
        self.test_auth_register()
        self.test_auth_register_duplicate()
        self.test_auth_login_valid()
        self.test_auth_login_invalid()
        self.test_auth_me()
        self.test_auth_me_no_token()
        
        # Test authenticated endpoints
        self.test_create_company()
        self.test_create_company_no_auth()
        
        # Test blog
        self.test_get_blog()
        self.test_get_blog_pagination()
        
        # Test contact
        self.test_contact_message()
        
        # Summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        failed = len(self.test_results) - passed
        
        print(f"Total Tests: {len(self.test_results)}")
        print(f"Passed: {passed}")
        print(f"Failed: {failed}")
        print(f"Success Rate: {(passed/len(self.test_results)*100):.1f}%")
        print()
        
        if failed > 0:
            print("FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"❌ {result['test']}: {result['details']}")
            print()
        
        print("=" * 60)

if __name__ == "__main__":
    tester = HALAPITester()
    tester.run_all_tests()