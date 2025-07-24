#!/usr/bin/env python3
"""
MeDocPro Automated Testing Pipeline
Comprehensive test runner with reporting and CI/CD integration
"""

import os
import sys
import subprocess
import json
import time
from pathlib import Path
import argparse
from datetime import datetime

class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'

def print_header(text):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{text.center(60)}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}")

def print_success(text):
    print(f"{Colors.GREEN}✅ {text}{Colors.END}")

def print_warning(text):
    print(f"{Colors.YELLOW}⚠️  {text}{Colors.END}")

def print_error(text):
    print(f"{Colors.RED}❌ {text}{Colors.END}")

def print_info(text):
    print(f"{Colors.BLUE}ℹ️  {text}{Colors.END}")

class TestRunner:
    def __init__(self):
        self.results = {
            'start_time': datetime.now().isoformat(),
            'tests': {},
            'summary': {}
        }
        self.test_results_dir = Path('test-results')
        self.test_results_dir.mkdir(exist_ok=True)

    def run_command(self, command, description):
        """Run a command and capture output"""
        print_info(f"Running: {description}")
        print_info(f"Command: {' '.join(command)}")
        
        start_time = time.time()
        try:
            result = subprocess.run(
                command,
                capture_output=True,
                text=True,
                check=False
            )
            duration = time.time() - start_time
            
            success = result.returncode == 0
            
            self.results['tests'][description] = {
                'command': ' '.join(command),
                'duration': round(duration, 2),
                'success': success,
                'returncode': result.returncode,
                'stdout': result.stdout,
                'stderr': result.stderr
            }
            
            if success:
                print_success(f"✅ {description} passed ({duration:.2f}s)")
            else:
                print_error(f"❌ {description} failed ({duration:.2f}s)")
                if result.stderr:
                    print_error(f"Error: {result.stderr.strip()}")
            
            return success, result
            
        except Exception as e:
            duration = time.time() - start_time
            print_error(f"❌ {description} error: {str(e)}")
            
            self.results['tests'][description] = {
                'command': ' '.join(command),
                'duration': round(duration, 2),
                'success': False,
                'error': str(e)
            }
            return False, None

    def run_config_validation(self):
        """Run configuration validation"""
        print_header("Configuration Validation")
        
        success, result = self.run_command(
            [sys.executable, 'scripts/validate-config.py'],
            'Configuration Validation'
        )
        return success

    def run_unit_tests(self):
        """Run unit tests with pytest"""
        print_header("Unit Tests")
        
        # Create test command
        cmd = [
            sys.executable, '-m', 'pytest',
            'tests/',
            '-v',
            '--tb=short',
            '--strict-markers',
            f'--junit-xml={self.test_results_dir}/junit.xml',
            f'--cov=app',
            f'--cov-report=html:{self.test_results_dir}/coverage',
            f'--cov-report=xml:{self.test_results_dir}/coverage.xml',
            '--cov-report=term-missing'
        ]
        
        success, result = self.run_command(cmd, 'Unit Tests')
        
        # Parse coverage results if available
        if success and result:
            self.parse_coverage_output(result.stdout)
        
        return success

    def run_integration_tests(self):
        """Run integration tests"""
        print_header("Integration Tests")
        
        cmd = [
            sys.executable, '-m', 'pytest', 
            'tests/integration/',
            '-v',
            '--tb=short',
            f'--junit-xml={self.test_results_dir}/integration-junit.xml'
        ]
        
        success, result = self.run_command(cmd, 'Integration Tests')
        return success

    def run_security_tests(self):
        """Run security tests"""
        print_header("Security Tests")
        
        # Run bandit security linter
        bandit_success, _ = self.run_command(
            [sys.executable, '-m', 'bandit', '-r', 'app/', '-f', 'json', 
             '-o', f'{self.test_results_dir}/bandit-report.json'],
            'Security Scan (Bandit)'
        )
        
        # Run safety check for known vulnerabilities
        safety_success, _ = self.run_command(
            [sys.executable, '-m', 'safety', 'check', '--json',
             '--output', f'{self.test_results_dir}/safety-report.json'],
            'Vulnerability Check (Safety)'
        )
        
        return bandit_success and safety_success

    def run_code_quality_tests(self):
        """Run code quality checks"""
        print_header("Code Quality")
        
        # Run flake8 linting
        flake8_success, _ = self.run_command(
            [sys.executable, '-m', 'flake8', 'app/', '--max-line-length=120',
             '--output-file', f'{self.test_results_dir}/flake8-report.txt'],
            'Code Linting (Flake8)'
        )
        
        # Run black formatting check
        black_success, _ = self.run_command(
            [sys.executable, '-m', 'black', '--check', '--diff', 'app/'],
            'Code Formatting (Black)'
        )
        
        # Run isort import sorting check
        isort_success, _ = self.run_command(
            [sys.executable, '-m', 'isort', '--check-only', '--diff', 'app/'],
            'Import Sorting (isort)'
        )
        
        return flake8_success and black_success and isort_success

    def run_frontend_tests(self):
        """Run frontend tests"""
        print_header("Frontend Tests")
        
        frontend_dir = Path('medocpro-dashboard')
        if not frontend_dir.exists():
            print_warning("Frontend directory not found, skipping frontend tests")
            return True
        
        # Check if package.json exists
        package_json = frontend_dir / 'package.json'
        if not package_json.exists():
            print_warning("package.json not found, skipping frontend tests")
            return True
        
        # Install dependencies if needed
        node_modules = frontend_dir / 'node_modules'
        if not node_modules.exists():
            install_success, _ = self.run_command(
                ['npm', 'install'],
                'Frontend Dependencies Install'
            )
            if not install_success:
                return False
        
        # Run frontend tests
        os.chdir(frontend_dir)
        try:
            # Run linting
            lint_success, _ = self.run_command(
                ['npm', 'run', 'lint'],
                'Frontend Linting'
            )
            
            # Run tests if test script exists
            test_success = True
            try:
                with open('package.json') as f:
                    package_data = json.load(f)
                    if 'test' in package_data.get('scripts', {}):
                        test_success, _ = self.run_command(
                            ['npm', 'test'],
                            'Frontend Unit Tests'
                        )
            except:
                print_info("No frontend test script found")
            
            # Build check
            build_success, _ = self.run_command(
                ['npm', 'run', 'build'],
                'Frontend Build'
            )
            
            return lint_success and test_success and build_success
            
        finally:
            os.chdir('..')

    def run_api_tests(self):
        """Run API endpoint tests"""
        print_header("API Tests")
        
        # Start a test server if not running
        # This would typically be done in a separate process
        cmd = [
            sys.executable, '-m', 'pytest',
            'tests/api/',
            '-v',
            '--tb=short',
            f'--junit-xml={self.test_results_dir}/api-junit.xml'
        ]
        
        success, result = self.run_command(cmd, 'API Endpoint Tests')
        return success

    def run_database_tests(self):
        """Run database migration and model tests"""
        print_header("Database Tests")
        
        # Test database migrations
        migration_success, _ = self.run_command(
            [sys.executable, 'manage.py', 'check-database'],
            'Database Connection Check'
        )
        
        # Test model creation/queries
        model_success, _ = self.run_command(
            [sys.executable, '-m', 'pytest', 'tests/models/', '-v'],
            'Database Model Tests'
        )
        
        return migration_success and model_success

    def parse_coverage_output(self, output):
        """Parse coverage information from pytest output"""
        lines = output.split('\n')
        for line in lines:
            if 'TOTAL' in line and '%' in line:
                # Extract coverage percentage
                parts = line.split()
                for i, part in enumerate(parts):
                    if '%' in part:
                        coverage = part.replace('%', '')
                        try:
                            self.results['summary']['coverage'] = float(coverage)
                            print_info(f"Code coverage: {coverage}%")
                        except ValueError:
                            pass
                        break

    def generate_report(self):
        """Generate test report"""
        print_header("Test Report Generation")
        
        self.results['end_time'] = datetime.now().isoformat()
        
        # Calculate summary
        total_tests = len(self.results['tests'])
        passed_tests = sum(1 for test in self.results['tests'].values() if test.get('success', False))
        failed_tests = total_tests - passed_tests
        
        total_duration = sum(test.get('duration', 0) for test in self.results['tests'].values())
        
        self.results['summary'].update({
            'total_tests': total_tests,
            'passed_tests': passed_tests,
            'failed_tests': failed_tests,
            'success_rate': round((passed_tests / total_tests * 100) if total_tests > 0 else 0, 2),
            'total_duration': round(total_duration, 2)
        })
        
        # Save detailed results
        report_file = self.test_results_dir / 'test-report.json'
        with open(report_file, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        # Generate HTML report
        self.generate_html_report()
        
        print_success(f"Test report saved to {report_file}")
        print_info(f"Tests run: {total_tests}")
        print_info(f"Passed: {passed_tests}")
        print_info(f"Failed: {failed_tests}")
        print_info(f"Success rate: {self.results['summary']['success_rate']}%")
        print_info(f"Total duration: {total_duration:.2f}s")
        
        if 'coverage' in self.results['summary']:
            print_info(f"Code coverage: {self.results['summary']['coverage']}%")

    def generate_html_report(self):
        """Generate HTML test report"""
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <title>MeDocPro Test Report</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; }}
        .header {{ background: #f0f0f0; padding: 20px; border-radius: 5px; }}
        .summary {{ display: flex; gap: 20px; margin: 20px 0; }}
        .metric {{ background: #e8f4f8; padding: 15px; border-radius: 5px; text-align: center; }}
        .test {{ margin: 10px 0; padding: 10px; border-left: 4px solid #ccc; }}
        .test.success {{ border-color: #4CAF50; background: #f0f8f0; }}
        .test.failure {{ border-color: #f44336; background: #fdf0f0; }}
        .duration {{ color: #666; font-size: 0.9em; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>MeDocPro Test Report</h1>
        <p>Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
    </div>
    
    <div class="summary">
        <div class="metric">
            <h3>{self.results['summary']['total_tests']}</h3>
            <p>Total Tests</p>
        </div>
        <div class="metric">
            <h3>{self.results['summary']['passed_tests']}</h3>
            <p>Passed</p>
        </div>
        <div class="metric">
            <h3>{self.results['summary']['failed_tests']}</h3>
            <p>Failed</p>
        </div>
        <div class="metric">
            <h3>{self.results['summary']['success_rate']}%</h3>
            <p>Success Rate</p>
        </div>
        <div class="metric">
            <h3>{self.results['summary'].get('coverage', 'N/A')}%</h3>
            <p>Coverage</p>
        </div>
    </div>
    
    <h2>Test Results</h2>
"""
        
        for test_name, test_data in self.results['tests'].items():
            status_class = 'success' if test_data.get('success', False) else 'failure'
            status_text = '✅ PASSED' if test_data.get('success', False) else '❌ FAILED'
            
            html_content += f"""
    <div class="test {status_class}">
        <h3>{test_name} {status_text}</h3>
        <p class="duration">Duration: {test_data.get('duration', 0):.2f}s</p>
        <p><strong>Command:</strong> <code>{test_data.get('command', '')}</code></p>
"""
            
            if test_data.get('stderr'):
                html_content += f"<p><strong>Error:</strong> <pre>{test_data['stderr']}</pre></p>"
            
            html_content += "</div>"
        
        html_content += """
</body>
</html>
"""
        
        html_file = self.test_results_dir / 'test-report.html'
        with open(html_file, 'w') as f:
            f.write(html_content)
        
        print_info(f"HTML report saved to {html_file}")

    def run_all_tests(self, test_types=None):
        """Run all or specified test types"""
        print_header("MeDocPro Automated Testing Pipeline")
        
        test_functions = {
            'config': self.run_config_validation,
            'unit': self.run_unit_tests,
            'integration': self.run_integration_tests,
            'security': self.run_security_tests,
            'quality': self.run_code_quality_tests,
            'frontend': self.run_frontend_tests,
            'api': self.run_api_tests,
            'database': self.run_database_tests
        }
        
        if test_types is None:
            test_types = list(test_functions.keys())
        
        overall_success = True
        
        for test_type in test_types:
            if test_type in test_functions:
                try:
                    success = test_functions[test_type]()
                    if not success:
                        overall_success = False
                except Exception as e:
                    print_error(f"Error running {test_type} tests: {str(e)}")
                    overall_success = False
            else:
                print_warning(f"Unknown test type: {test_type}")
        
        # Generate report
        self.generate_report()
        
        # Final summary
        if overall_success:
            print_success("🎉 All tests passed!")
        else:
            print_error("💥 Some tests failed!")
        
        return overall_success


def main():
    parser = argparse.ArgumentParser(description='Run MeDocPro test suite')
    parser.add_argument(
        '--types',
        nargs='+',
        choices=['config', 'unit', 'integration', 'security', 'quality', 'frontend', 'api', 'database'],
        help='Test types to run (default: all)'
    )
    parser.add_argument(
        '--output-dir',
        default='test-results',
        help='Output directory for test results'
    )
    
    args = parser.parse_args()
    
    # Set up test results directory
    if args.output_dir != 'test-results':
        os.environ['TEST_RESULTS_DIR'] = args.output_dir
    
    runner = TestRunner()
    success = runner.run_all_tests(args.types)
    
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()